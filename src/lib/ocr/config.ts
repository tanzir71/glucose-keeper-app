// M3.0 spike outcome (docs/keeper-v2/ocr-spike.md). Open question 2's default: if OCR is under
// 85% on the test set, "Type it privately" becomes the primary path and the photo stays as a
// secondary option, read on the phone with the same safety net.
// Flip this to true once real meter photos reach ≥ 85% (e.g. with seven-segment traineddata).
export const OCR_IS_PRIMARY = false;

// Measured on synthetic images in the browser (stock eng 4.0.0_best_int, LSTM only):
// proportional fonts 7/8 correct, seven-segment digits 1/10 correct, 0 wrong values returned.
export const OCR_SPIKE = { proportional: "7/8", sevenSegment: "1/10", wrongValues: 0, realPhotos: "not yet measured" } as const;
