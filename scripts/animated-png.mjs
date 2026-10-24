// Full-canvas APNG frames, following https://www.w3.org/TR/png-3/#11acTL.
// Reuses the lossless PNG pixels produced by resvg; no browser-time vector animation.
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const table = Array.from({ length: 256 }, (_, index) => {
    let crc = index;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    return crc >>> 0;
});
const crc32 = data => {
    let crc = 0xffffffff;
    for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
};
const uint = value => { const buffer = Buffer.alloc(4); buffer.writeUInt32BE(value); return buffer; };
const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    return Buffer.concat([uint(data.length), body, uint(crc32(body))]);
};
export function pngChunks(png) {
    if (!png.subarray(0, 8).equals(signature)) throw new Error('Invalid PNG');
    const chunks = [];
    for (let offset = 8; offset < png.length;) {
        if (offset + 12 > png.length) throw new Error('Truncated PNG');
        const length = png.readUInt32BE(offset);
        if (offset + length + 12 > png.length) throw new Error('Truncated PNG chunk');
        const type = png.toString('ascii', offset + 4, offset + 8);
        const data = png.subarray(offset + 8, offset + 8 + length);
        if (crc32(png.subarray(offset + 4, offset + 8 + length)) !== png.readUInt32BE(offset + 8 + length)) throw new Error('Invalid PNG checksum');
        chunks.push({ type, data });
        offset += length + 12;
    }
    return chunks;
}
export function animatedPng(frames, seconds) {
    if (!frames.length || !(seconds > 0)) throw new Error('Animation needs frames and a positive duration');
    const parsed = frames.map(pngChunks);
    const header = parsed[0].find(item => item.type === 'IHDR')?.data;
    if (!header || header.length !== 13 || header[9] !== 6) throw new Error('Expected RGBA PNG frames');
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const milliseconds = Math.round(seconds * 1000);
    const divisor = gcd(milliseconds, frames.length * 1000);
    const delayNumerator = milliseconds / divisor;
    const delayDenominator = frames.length * 1000 / divisor;
    if (!delayNumerator || delayNumerator > 65535 || delayDenominator > 65535) throw new Error('Frame timing is outside APNG limits');
    const output = [signature, chunk('IHDR', header), chunk('acTL', Buffer.concat([uint(frames.length), uint(0)]))];
    let sequence = 0;
    for (const [index, chunks] of parsed.entries()) {
        if (!chunks.find(item => item.type === 'IHDR')?.data.equals(header)) throw new Error('Frame formats must match');
        const control = Buffer.alloc(26);
        control.writeUInt32BE(sequence++, 0);
        header.copy(control, 4, 0, 8); // Width and height; offsets remain zero.
        control.writeUInt16BE(delayNumerator, 20);
        control.writeUInt16BE(delayDenominator, 22);
        // SOURCE blending replaces transparent pixels too, so moving limbs leave no trails.
        output.push(chunk('fcTL', control));
        const data = Buffer.concat(chunks.filter(item => item.type === 'IDAT').map(item => item.data));
        if (!data.length) throw new Error('Frame has no image data');
        output.push(index === 0 ? chunk('IDAT', data) : chunk('fdAT', Buffer.concat([uint(sequence++), data])));
    }
    output.push(chunk('IEND', Buffer.alloc(0)));
    return Buffer.concat(output);
}
