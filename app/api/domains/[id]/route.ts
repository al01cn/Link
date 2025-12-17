import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { translateForRequest } from '@/lib/translations'

// UUID 验证函数
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 删除域名规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 16+ 中 params 是 Promise，需要 await
    const resolvedParams = await params
    const id = resolvedParams.id
    
    // 验证 UUID 格式
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: translateForRequest(request, 'apiInvalidIdFormat') }, { status: 400 })
    }

    // 先检查记录是否存在
    const existingRule = await prisma.domainRule.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json({ error: translateForRequest(request, 'apiDomainRuleNotFound') }, { status: 404 })
    }

    // 执行删除操作
    const deleteResult = await prisma.domainRule.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      message: translateForRequest(request, 'apiDeleteSuccess'), 
      deletedRule: deleteResult 
    })
  } catch (error) {
    console.error('删除域名规则失败:', error)
    
    // 处理 Prisma 特定错误
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ error: translateForRequest(request, 'apiDomainRuleNotFound') }, { status: 404 })
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({ error: translateForRequest(request, 'apiInvalidIdFormat') }, { status: 400 })
      }
    }
    
    return NextResponse.json({ 
      error: translateForRequest(request, 'serverError'), 
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
    }, { status: 500 })
  }
}