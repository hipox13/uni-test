/**
 * Response DTO for media upload.
 */
export class UploadResponseDto {
  id: bigint;
  name: string | null;
  title: string | null;
  url: string; // Public URL or path
  mediaType: string | null;
  fileSize: number | null;
  extension: string | null;
  datePosted: Date | null;
}
