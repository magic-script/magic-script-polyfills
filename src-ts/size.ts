
export function getSize(data: Uint8Array) {
    // tslint:disable: no-bitwise
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47 && data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a) {
        // PNG header found!
        return {
            type: 'png',
            width: data[16] << 24 | data[17] << 16 | data[18] << 8 | data[19],
            height: data[20] << 24 | data[21] << 16 | data[22] << 8 | data[23],
            depth: data[24],
        };
    }
    if (data[0] === 0xff && data[1] === 0xd8) {
        // JPEG found maybe
        let offset = 2;
        while (offset < data.length) {
            if (data[offset++] !== 0xff) break; // It wasn't a jpeg after all.
            const marker = data[offset++];
            if (marker === 0xc0 || marker === 0xc2) {
                // SOF marker found
                return {
                    type: 'jpeg',
                    width: data[offset + 5] << 8 | data[offset + 6],
                    height: data[offset + 3] << 8 | data[offset + 4],
                    depth: data[offset + 2],
                };
            } else {
                // Skip the marker by reading the length.
                offset += data[offset] << 8 | data[offset + 1];
            }
        }
    }
    if (data[0] === 0x38 && data[1] === 0x42 && data[2] === 0x50 && data[3] === 0x53) {
        // Photoshop image found!
        return {
            type: 'psd',
            width: data[14] << 24 | data[15] << 16 | data[16] << 8 | data[17],
            height: data[18] << 24 | data[19] << 16 | data[20] << 8 | data[21],
            depth: data[22] << 8 | data[23],
        };
    }
    return {
        type: "unknown"
    };
}

