declare module 'qrcode' {
    export interface QRCodeOptions {
        margin?: number;
        scale?: number;
        width?: number;
        color?: {
            dark?: string;
            light?: string;
        };
        errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }

    export function toDataURL(
        text: string | QRCodeSegment[],
        options?: QRCodeOptions
    ): Promise<string>;

    export function toDataURL(
        text: string | QRCodeSegment[],
        callback: (error: Error | null | undefined, url: string) => void
    ): void;

    export function toDataURL(
        text: string | QRCodeSegment[],
        options: QRCodeOptions,
        callback: (error: Error | null | undefined, url: string) => void
    ): void;

    export interface QRCodeSegment {
        data: string | Buffer;
        mode?: 'alphanumeric' | 'numeric' | 'kanji' | 'byte';
    }
}
