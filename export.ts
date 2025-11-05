// 导出相关函数模块

import { sanitizeFileName, getVariantName } from './utils';

/**
 * 导出节点为SVG文件
 */
export async function exportNodeAsSVG(node: SceneNode, fileName: string): Promise<{ fileName: string; content: string }> {
  try {
    // 确保文件名有效
    const safeFileName = fileName || 'unnamed';
    
    // 导出为SVG
    const svgBytes = await node.exportAsync({ format: 'SVG' });
    
    // 将SVG字节数组转换为字符串
    // Figma 插件环境中没有 TextDecoder，需要手动转换
    // 将 Uint8Array 转换为字符串
    let svgString = '';
    for (let i = 0; i < svgBytes.length; i++) {
      svgString += String.fromCharCode(svgBytes[i]);
    }
    
    // 返回文件信息，而不是立即发送
    return {
      fileName: `${safeFileName}.svg`,
      content: svgString
    };
    
  } catch (error) {
    const nodeName = node.name || '未知节点';
    console.error(`导出节点 ${nodeName} 为SVG时出错:`, error);
    throw error;
  }
}

/**
 * 导出单个组件为SVG
 */
export async function exportComponentAsSVG(component: SceneNode): Promise<{ fileName: string; content: string }[]> {
  const files: { fileName: string; content: string }[] = [];
  
  try {
    // 获取组件名称，清理文件名中的非法字符
    const componentName = sanitizeFileName(component.name);
    
    // 如果是组件集，需要导出每个变体
    if (component.type === 'COMPONENT_SET') {
      const componentSet = component as ComponentSetNode;
      const variantProperties = componentSet.variantGroupProperties || {};
      
      // 确保 children 存在且是数组
      if (componentSet.children && Array.isArray(componentSet.children)) {
        const variants = componentSet.children as ComponentNode[];
        
        for (const variant of variants) {
          if (variant && variant.type === 'COMPONENT') {
            try {
              const variantName = getVariantName(variant, variantProperties);
              const fullName = `${componentName}_${variantName}`;
              const file = await exportNodeAsSVG(variant, fullName);
              files.push(file);
            } catch (error) {
              const variantName = variant.name || '未知变体';
              console.error(`导出变体 ${variantName} 时出错:`, error);
            }
          }
        }
      }
    } else {
      // 导出单个组件
      try {
        const file = await exportNodeAsSVG(component, componentName);
        files.push(file);
      } catch (error) {
        const componentName = component.name || '未知组件';
        console.error(`导出组件 ${componentName} 时出错:`, error);
        throw error;
      }
    }
  } catch (error) {
    const componentName = component.name || '未知组件';
    console.error(`导出组件 ${componentName} 时出错:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    figma.notify(`导出 ${componentName} 失败: ${errorMessage}`, { error: true });
  }
  
  return files;
}

