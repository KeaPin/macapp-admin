import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { jsonError, jsonOk } from "@/server/http";

function generateObjectKey(prefix: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const now = new Date();
  const ts = now.getTime();
  return `${prefix}/${ts}-${Math.random().toString(36).slice(2, 8)}${safeName}`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError(new Error("file is required"), 400);

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return jsonError(new Error("Only image files (jpeg, png, gif, webp) are allowed"), 400);
    }

    // 验证文件大小（最大10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return jsonError(new Error("File size too large. Maximum size is 10MB"), 400);
    }

    const contentType = file.type || "application/octet-stream";
    const key = generateObjectKey("icons/app", file.name || "icon.png");

    // 优先：在 Cloudflare 运行时使用 R2 绑定
    // 在开发环境强制使用 S3 兼容 API，避免 getCloudflareContext 的假环境问题
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      try {
        const { env } = getCloudflareContext();
        const cloudflareEnv = env as CloudflareEnv;
        
        if (cloudflareEnv.R2) {
          const putResult = await cloudflareEnv.R2.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType },
          });
          
          if (!putResult) return jsonError(new Error("R2 upload failed"), 500);

          // 写入后进行 HEAD 校验
          const head = await cloudflareEnv.R2.head(key);
          if (!head) {
            return jsonError(new Error("Upload verification failed: object not found after put (R2 binding)"), 500);
          }

          const publicBase = cloudflareEnv.R2_PUBLIC_BASE || process.env.R2_PUBLIC_BASE;
          const url = publicBase
            ? `${publicBase.replace(/\/$/, "")}/${key}`
            : `/${key}`; // 回退：仅返回 key

          console.log("[R2 upload success]", { 
            key, 
            size: head.size, 
            etag: head.etag, 
            contentType: head.httpMetadata?.contentType,
            url 
          });
          
          return jsonOk({ key, url });
        } else {
          console.log("[Production] No R2 binding found, falling back to S3-compatible API");
        }
      } catch (error) {
        console.error("[R2 binding error]", error);
        return jsonError(new Error(`R2 binding upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`), 500);
      }
    } else {
      console.log("[Development] Using S3-compatible API for R2 upload");
    }

    // S3 兼容 API 直传 R2（从环境变量读取配置）
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || "macapp";
    const region = process.env.R2_S3_REGION || "auto";
    const endpoint = process.env.R2_S3_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

    if (!accountId || !accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
      return jsonError(
        new Error(
          "Local R2 configuration missing. Please create .env.local file with R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME. See .env.local.example for reference."
        ),
        500
      );
    }

    try {
      // 动态导入，避免在 Cloudflare Worker 打包时强制包含依赖
      const { S3Client, PutObjectCommand, HeadObjectCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });

      const body = Buffer.from(await file.arrayBuffer());
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );

      // 写入后进行 HEAD 校验
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
      
      const publicBase = process.env.R2_PUBLIC_BASE || `${endpoint.replace(/\/$/, "")}/${bucketName}`;
      const url = `${publicBase.replace(/\/$/, "")}/${key}`;
      
      console.log("[R2 S3 upload success]", { 
        key, 
        etag: head.ETag, 
        size: head.ContentLength, 
        contentType: head.ContentType, 
        bucket: bucketName, 
        endpoint,
        url 
      });
      
      return jsonOk({ key, url });
    } catch (error) {
      console.error("[R2 S3 upload error]", error);
      return jsonError(new Error(`S3-compatible upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`), 500);
    }
  } catch (e) {
    return jsonError(e);
  }
}


