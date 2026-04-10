const fs = require("fs/promises");
const path = require("path");

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  const mime = m[1];
  const b64 = m[2];
  return { mime, b64 };
}

function isJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPng(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (buf[i] !== sig[i]) return false;
  return true;
}

async function saveOrderProof({ orderId, photoDataUrl }) {
  const parsed = parseDataUrl(photoDataUrl);
  if (!parsed) {
    const err = new Error("PHOTO_INVALID");
    err.code = "PHOTO_INVALID";
    throw err;
  }

  if (!["image/jpeg", "image/png"].includes(parsed.mime)) {
    const err = new Error("PHOTO_UNSUPPORTED");
    err.code = "PHOTO_UNSUPPORTED";
    throw err;
  }

  let buf;
  try {
    buf = Buffer.from(parsed.b64, "base64");
  } catch {
    const err = new Error("PHOTO_INVALID");
    err.code = "PHOTO_INVALID";
    throw err;
  }

  if (!buf || buf.length === 0) {
    const err = new Error("PHOTO_INVALID");
    err.code = "PHOTO_INVALID";
    throw err;
  }

  if (buf.length > MAX_BYTES) {
    const err = new Error("PHOTO_TOO_LARGE");
    err.code = "PHOTO_TOO_LARGE";
    throw err;
  }

  const signatureOk = parsed.mime === "image/jpeg" ? isJpeg(buf) : isPng(buf);
  if (!signatureOk) {
    const err = new Error("PHOTO_NOT_IMAGE");
    err.code = "PHOTO_NOT_IMAGE";
    throw err;
  }

  const ext = parsed.mime === "image/png" ? "png" : "jpg";
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  const ordersDir = path.join(dir, "orders");
  await fs.mkdir(ordersDir, { recursive: true });

  const filename = `${orderId}.${ext}`;
  const filePath = path.join(ordersDir, filename);
  await fs.writeFile(filePath, buf, { flag: "w" });

  // URL simple (backend): sera servi par express static
  const publicPath = `/uploads/orders/${filename}`;
  return publicPath;
}

async function deleteProofByPublicPath(publicPath) {
  try {
    const p = String(publicPath || "");
    if (!p.startsWith("/uploads/")) return;
    const rel = p.replace(/^\/uploads\//, "");
    const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const full = path.join(dir, rel);
    await fs.unlink(full);
  } catch {
    // ignore
  }
}

async function saveTestimonialPhoto({ testimonialId, photoDataUrl }) {
  const parsed = parseDataUrl(photoDataUrl);
  if (!parsed) {
    const err = new Error("PHOTO_INVALID");
    err.code = "PHOTO_INVALID";
    throw err;
  }

  if (!["image/jpeg", "image/png"].includes(parsed.mime)) {
    const err = new Error("PHOTO_UNSUPPORTED");
    err.code = "PHOTO_UNSUPPORTED";
    throw err;
  }

  let buf;
  try {
    buf = Buffer.from(parsed.b64, "base64");
  } catch {
    const err = new Error("PHOTO_INVALID");
    err.code = "PHOTO_INVALID";
    throw err;
  }

  if (!buf || buf.length === 0) {
    const err = new Error("PHOTO_INVALID");
    err.code = "PHOTO_INVALID";
    throw err;
  }

  if (buf.length > MAX_BYTES) {
    const err = new Error("PHOTO_TOO_LARGE");
    err.code = "PHOTO_TOO_LARGE";
    throw err;
  }

  const signatureOk = parsed.mime === "image/jpeg" ? isJpeg(buf) : isPng(buf);
  if (!signatureOk) {
    const err = new Error("PHOTO_NOT_IMAGE");
    err.code = "PHOTO_NOT_IMAGE";
    throw err;
  }

  const ext = parsed.mime === "image/png" ? "png" : "jpg";
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  const subDir = path.join(dir, "testimonials");
  await fs.mkdir(subDir, { recursive: true });

  const filename = `${testimonialId}.${ext}`;
  const filePath = path.join(subDir, filename);
  await fs.writeFile(filePath, buf, { flag: "w" });

  return `/uploads/testimonials/${filename}`;
}

module.exports = { saveOrderProof, saveTestimonialPhoto, deleteProofByPublicPath, MAX_BYTES };

