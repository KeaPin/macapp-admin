import bcrypt from "bcryptjs";

async function hashPassword(password) {
  const saltRounds = 12; // 与系统中使用的相同强度
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

async function main() {
  const password = "As@456123";
  
  console.log("🔐 正在生成密码哈希值...");
  console.log(`原始密码: ${password}`);
  
  try {
    const hashedPassword = await hashPassword(password);
    console.log(`哈希值: ${hashedPassword}`);
    console.log("\n✅ 密码哈希值生成成功！");
    console.log("\n💡 您可以使用此哈希值：");
    console.log("1. 手动插入数据库");
    console.log("2. 更新现有用户的密码");
    console.log("3. 在创建用户脚本中使用");
    
    // 同时验证哈希值是否正确
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`\n🔍 验证结果: ${isValid ? '✅ 正确' : '❌ 错误'}`);
    
  } catch (error) {
    console.error("❌ 生成哈希值时出错:", error);
  }
}

main();
