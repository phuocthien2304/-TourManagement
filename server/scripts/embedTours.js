import { QdrantClient } from '@qdrant/js-client-rest';
import { pipeline } from '@xenova/transformers';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
const Tour = require('../models/Tour.js');
const mongoose = require("mongoose");

dotenv.config();

function mongoIdToUUID(id) {
  // 1. Đệm 8 số 0 vào đầu để đủ 32 ký tự
  const paddedId = id.padStart(32, '0');
  
  // 2. Thêm các dấu gạch nối theo định dạng UUID: 8-4-4-4-12
  return `${paddedId.substring(0, 8)}-${paddedId.substring(8, 12)}-${paddedId.substring(12, 16)}-${paddedId.substring(16, 20)}-${paddedId.substring(20)}`;
}

function getPriceSegment(price, duration) {
  // Đề phòng trường hợp duration lỗi hoặc = 0, mặc định là 1 ngày
  const days = duration && duration > 0 ? duration : 1;
  const pricePerDay = price / days;

  // Các mốc giá này bạn có thể tùy chỉnh theo thị trường thực tế
  if (pricePerDay < 1000000) {
    return "Phân khúc giá rẻ, tiết kiệm, bình dân, homestay, backpacking";
  }
  if (pricePerDay < 2500000) {
    return "Phân khúc phổ thông, tiêu chuẩn, khách sạn 3 sao";
  }
  if (pricePerDay < 4500000) {
    return "Phân khúc cao cấp, sang trọng, khách sạn 4 sao, tiện nghi";
  }
  return "Phân khúc hạng sang, luxury, nghỉ dưỡng 5 sao, thượng lưu, đắt đỏ";
}


function getSemanticTags(type) {
  switch (type) {
    case 'beach':
      return "Du lịch biển đảo, tắm biển, bãi biển, đại dương, ocean, sea, beach, nghỉ dưỡng ven biển, lặn ngắm san hô, cano";
    case 'adventure':
      return "Du lịch mạo hiểm, leo núi, trekking, hiking, mountain, chinh phục đỉnh cao, đèo dốc, cao nguyên, thử thách";
    case 'nature':
      return "Khám phá thiên nhiên, rừng núi, cây cối, nature, phong cảnh, sinh thái, yên bình, thư giãn, chữa lành";
    case 'cultural':
      return "Văn hóa lịch sử, di sản, đền chùa, tâm linh, kiến trúc cổ, heritage, history, phố cổ, truyền thống";
    case 'city':
      return "Du lịch thành phố, city tour, hiện đại, mua sắm, shopping, sôi động, giải trí, công viên, nightlife";
    case 'luxury':
      return "Nghỉ dưỡng sang trọng, luxury, cao cấp, 5 sao, thượng lưu, resort, đắt đỏ, dịch vụ vip";
    default:
      return "Du lịch tham quan, trải nghiệm";
  }
}


// 1. Khởi tạo
const qdrant = new QdrantClient({ url: 'http://localhost:6333' });

if (!process.env.MONGODB_URI) {
  console.error("Lỗi: MONGODB_URI không được tìm thấy trong file .env");
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI);

const QDRANT_COLLECTION_NAME = 'tours';

// 2. Tải mô hình AI
console.log('Đang tải mô hình AI. Việc này mất vài phút...');
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
console.log('Tải mô hình thành công!');

const embedTours = async () => {
  // 3. Tạo collection trong Qdrant
  try {
    await qdrant.recreateCollection(QDRANT_COLLECTION_NAME, {
      vectors: { size: 384, distance: 'Cosine' },
    });
    console.log('Đã tạo collection "tours" trên Qdrant.');
  } catch (e) {
    console.error("Lỗi khi tạo collection Qdrant:", e.message);
    mongoose.disconnect();
    return;
  }

  // 4. Lấy tour từ MongoDB
  const tours = await Tour.find({ status: "active" });
  console.log(`Tìm thấy ${tours.length} tour từ MongoDB.`);

  let pointsToUpsert = [];

  for (const tour of tours) {
    const priceSegment = getPriceSegment(tour.price, tour.duration);
    const semanticTags = getSemanticTags(tour.tourType); 

    const textToEmbed = `
      Chủ đề: ${semanticTags}
      Loại hình: ${tour.tourType}
      Phân khúc: ${priceSegment}
      Điểm đến: ${tour.destination}, ${tour.country}
      Tên tour: ${tour.tourName}
      Nội dung chính: ${tour.highlights ? tour.highlights.join(', ') : ''}
      Chi tiết lịch trình: ${tour.itinerary}
    `;

    // 6. Tạo vector
    const output = await extractor(textToEmbed, {
      pooling: 'mean', normalize: true,
    });
    const vector = Array.from(output.data);
    const mongoId = tour._id.toString();
    const qdrantId = mongoIdToUUID(mongoId);

    pointsToUpsert.push({
      id: qdrantId, 
      vector: vector,
      payload: { 
        mongo_id: mongoId,
        category: tour.category, // Ví dụ: "domestic"
        tourType: tour.tourType,  // Ví dụ: "beach"
        destination: tour.destination 
      }
    });

    console.log(`Đã vector hóa: ${tour.tourName}`);
  }

  // 7. Đẩy đồng loạt lên Qdrant
  if (pointsToUpsert.length > 0) {
    await qdrant.upsert(QDRANT_COLLECTION_NAME, {
      wait: true,
      points: pointsToUpsert,
    });
  }

  console.log(`Hoàn tất! Đã đẩy ${pointsToUpsert.length} vector lên Qdrant.`);
  mongoose.disconnect();
};

embedTours();