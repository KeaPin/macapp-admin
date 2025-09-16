#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 确保所有必要的配置都正确设置
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 开始部署前检查...');

const errors = [];
const warnings = [];

// 检查 wrangler.jsonc 配置
console.log('📋 检查 wrangler.jsonc 配置...');
try {
  const wranglerContent = fs.readFileSync('wrangler.jsonc', 'utf8');
  
  // 简单的字符串检查，不解析JSON
  if (wranglerContent.includes('"hyperdrive"') && wranglerContent.includes('"binding": "HYPERDRIVE"')) {
    console.log('✅ HYPERDRIVE 配置正常');
  } else {
    errors.push('❌ HYPERDRIVE 配置缺失或不完整');
  }
  
  if (wranglerContent.includes('"SECRET_COOKIE_PASSWORD"')) {
    console.log('✅ SECRET_COOKIE_PASSWORD 已配置');
  } else {
    errors.push('❌ SECRET_COOKIE_PASSWORD 环境变量未配置');
  }
  
  if (wranglerContent.includes('"r2_buckets"') && wranglerContent.includes('"binding": "R2"')) {
    console.log('✅ R2 存储桶配置正常');
  } else {
    warnings.push('⚠️ R2 存储桶配置缺失，如果使用文件上传功能可能会失败');
  }
  
} catch (error) {
  errors.push(`❌ 读取 wrangler.jsonc 失败: ${error.message}`);
}

// 检查 open-next.config.ts
console.log('📋 检查 open-next.config.ts...');
try {
  const openNextConfig = fs.readFileSync('open-next.config.ts', 'utf8');
  if (openNextConfig.includes('defineCloudflareConfig')) {
    console.log('✅ OpenNext Cloudflare 配置正常');
  } else {
    errors.push('❌ OpenNext Cloudflare 配置错误');
  }
} catch (error) {
  errors.push(`❌ 读取 open-next.config.ts 失败: ${error.message}`);
}

// 检查关键文件是否存在
console.log('📋 检查关键文件...');
const requiredFiles = [
  'src/app/api/health/route.ts',
  'src/middleware.ts',
  'src/server/auth.ts',
  'src/server/db.ts'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} 存在`);
  } else {
    errors.push(`❌ 关键文件缺失: ${file}`);
  }
}

// 检查 TypeScript 编译
console.log('📋 检查 TypeScript 类型...');
try {
  const { execSync } = await import('child_process');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript 类型检查通过');
} catch (error) {
  warnings.push('⚠️ TypeScript 类型检查失败，请检查代码中的类型错误');
}

// 输出结果
console.log('\n📊 检查结果:');

if (warnings.length > 0) {
  console.log('\n警告:');
  warnings.forEach(warning => console.log(warning));
}

if (errors.length > 0) {
  console.log('\n错误:');
  errors.forEach(error => console.log(error));
  console.log('\n❌ 部署前检查失败，请修复上述错误后再次尝试部署');
  process.exit(1);
} else {
  console.log('\n✅ 部署前检查通过，可以开始部署！');
  console.log('\n💡 部署后建议:');
  console.log('1. 访问 /api/health 端点检查应用状态');
  console.log('2. 查看 Cloudflare Workers 控制台的日志');
  console.log('3. 测试登录功能确保认证正常工作');
}
