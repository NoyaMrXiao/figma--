// 工具函数模块

/**
 * 清理文件名，移除非法字符
 */
export function sanitizeFileName(fileName: string | null | undefined): string {
  // 处理空值
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed';
  }
  
  // 移除或替换文件名中的非法字符
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')  // 替换非法字符
    .replace(/\s+/g, '_')            // 替换空格为下划线
    .replace(/_{2,}/g, '_')          // 替换多个连续下划线为单个
    .replace(/^_+|_+$/g, '')         // 移除首尾下划线
    .trim() || 'unnamed';            // 如果结果为空，返回默认名称
}

/**
 * 递归查找节点中的组件
 */
export function findComponentsInNode(node: SceneNode, components: SceneNode[]): void {
  if (node.type === 'COMPONENT_SET' || node.type === 'COMPONENT') {
    components.push(node);
  } else if ('children' in node) {
    node.children.forEach(child => {
      findComponentsInNode(child, components);
    });
  }
}

/**
 * 获取变体名称
 */
export function getVariantName(
  variant: ComponentNode,
  variantProperties: { [key: string]: VariantGroupProperties } | null | undefined
): string {
  const nameParts: string[] = [];
  
  // 检查 variantProperties 是否存在
  if (variantProperties && typeof variantProperties === 'object') {
    Object.keys(variantProperties).forEach(propKey => {
      const variantProps = variant.variantProperties;
      if (variantProps && typeof variantProps === 'object') {
        const propValue = variantProps[propKey];
        if (propValue && (typeof propValue === 'string' || typeof propValue === 'number')) {
          nameParts.push(sanitizeFileName(String(propValue)));
        }
      }
    });
  }
  
  // 如果有变体属性名称，返回组合的名称；否则返回组件名称或默认名称
  if (nameParts.length > 0) {
    return nameParts.join('_');
  }
  
  // 确保 variant.name 是字符串
  return sanitizeFileName(variant.name);
}

