const { pipeline } = require('@xenova/transformers');

// Biến lưu model để không phải load lại nhiều lần
let embedder = null;

// Hàm khởi tạo model (Singleton pattern)
async function getEmbedder() {
    if (!embedder) {
        console.log("Đang tải model AI (lần đầu)...");
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log("Model AI đã sẵn sàng!");
    }
    return embedder;
}

// Hàm chính: Chuyển văn bản thành Vector
async function generateEmbedding(text) {
    const extractor = await getEmbedder();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

// Hàm ghép các trường thông tin thành một đoạn văn bản để AI đọc
function prepareTextForEmbedding(tour) {
    // Kết hợp: Tên + Điểm đến + Danh mục + Mô tả lịch trình
    // Bạn có thể thêm các trường khác nếu muốn AI hiểu sâu hơn
    return `
        Chủ đề: ${semanticTags}
        Loại hình: ${tour.tourType}
        Phân khúc: ${priceSegment}
        Điểm đến: ${tour.destination}, ${tour.country}
        Tên tour: ${tour.tourName}
        Nội dung chính: ${tour.highlights ? tour.highlights.join(', ') : ''}
        Chi tiết lịch trình: ${tour.itinerary}
    `.replace(/\s+/g, ' ').trim();
}

module.exports = { generateEmbedding, prepareTextForEmbedding };