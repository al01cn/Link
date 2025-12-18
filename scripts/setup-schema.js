#!/usr/bin/env node

/**
 * 根据环境变量设置正确的 Prisma schema 文件
 */

const fs = require('fs');
const path = require('path');

// 获取数据库提供商，默认为 sqlite
const databaseProvider = process.env.DATABASE_PROVIDER || 'sqlite';

// 支持的数据库提供商
const supportedProviders = ['sqlite', 'postgresql', 'mysql'];

if (!supportedProviders.includes(databaseProvider)) {
  console.error(`❌ 不支持的数据库提供商: ${databaseProvider}`);
  console.error(`✅ 支持的提供商: ${supportedProviders.join(', ')}`);
  process.exit(1);
}

// 源文件和目标文件路径
const sourceFile = path.join(__dirname, '..', 'prisma', `schema.${databaseProvider}.prisma`);
const targetFile = path.join(__dirname, '..', 'prisma', 'schema.prisma');

try {
  // 检查源文件是否存在
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Schema 文件不存在: ${sourceFile}`);
    process.exit(1);
  }

  // 复制文件
  fs.copyFileSync(sourceFile, targetFile);
  
  console.log(`✅ 已设置 ${databaseProvider} 数据库 schema`);
  console.log(`📁 源文件: schema.${databaseProvider}.prisma`);
  console.log(`📁 目标文件: schema.prisma`);
  
} catch (error) {
  console.error(`❌ 设置 schema 文件时出错:`, error.message);
  process.exit(1);
}