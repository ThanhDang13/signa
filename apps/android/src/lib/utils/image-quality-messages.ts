/**
 * Vietnamese translations for image quality validation messages
 */

export const IMAGE_QUALITY_MESSAGES = {
  resolutionTooLow: (width: number, height: number) =>
    `Độ phân giải quá thấp (${width}x${height}). Hãy di chuyển gần hơn với phiếu bầu hoặc sử dụng camera có độ phân giải cao hơn.`,

  imageToDark: "Hình ảnh quá tối. Tăng ánh sáng hoặc điều chỉnh độ phơi sáng của camera.",

  imageToBright: "Hình ảnh quá sáng. Giảm ánh sáng hoặc điều chỉnh độ phơi sáng của camera.",

  lowContrast: "Phát hiện độ tương phản thấp. Đảm bảo ánh sáng đều mà không có bóng hoặc ánh chói.",

  imageBlurry: "Hình ảnh có vẻ mờ. Giữ camera ổn định và đảm bảo phiếu bầu trong tiêu cụ.",

  considerMovingCloser: "Nên di chuyển gần hơn với phiếu bầu để có chất lượng tốt hơn.",

  lightingBorderline: "Ánh sáng ở mức biên. Sử dụng ánh sáng đều và tránh bóng hoặc ánh chói.",

  contrastBorderline: "Độ tương phản ở mức biên. Đảm bảo phiếu bầu được chiếu sáng đều.",

  analysisError: "Không thể phân tích chất lượng hình ảnh. Vui lòng chụp lại ảnh.",

  noDimensions: "Hình ảnh đã chụp không có kích thước",

  noPixelData: "Phân tích hình ảnh không tạo ra dữ liệu pixel",

  base64DecodingUnavailable: "Giải mã Base64 không khả dụng trên thiết bị này",
} as const;
