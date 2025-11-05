// 导出组件集为SVG的主脚本

// 声明 __html__ 变量（Figma插件构建工具会自动注入）
declare const __html__: string;

import { findComponentsInNode } from './utils';
import { exportComponentAsSVG } from './export';

figma.showUI(__html__, { width: 300, height: 250 });

// 检测选中状态并发送给UI
function checkSelection() {
  const selection = figma.currentPage.selection;
  const hasSelection = selection.length > 0;
  
  // 检查是否有组件
  let componentCount = 0;
  if (hasSelection) {
    const components: SceneNode[] = [];
    selection.forEach(node => {
      if (node.type === 'COMPONENT_SET' || node.type === 'COMPONENT') {
        components.push(node);
      } else if (node.type === 'INSTANCE') {
        const mainComponent = node.mainComponent;
        if (mainComponent) {
          components.push(mainComponent);
        }
      } else if ('children' in node) {
        findComponentsInNode(node, components);
      }
    });
    
    // 去重
    componentCount = Array.from(
      new Map(components.map(comp => [comp.id, comp])).values()
    ).length;
  }
  
  figma.ui.postMessage({
    type: 'selection-status',
    hasSelection: hasSelection,
    componentCount: componentCount
  });
}

// 初始化时检查选中状态
checkSelection();

// 监听选中变化
figma.on('selectionchange', () => {
  checkSelection();
});

// 处理UI消息
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'export-svg') {
    await exportComponentsAsSVG();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  } else if (msg.type === 'check-selection') {
    checkSelection();
  }
};

// 导出组件为SVG的主要函数
async function exportComponentsAsSVG() {
  try {
    // 获取选中的节点
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.notify('请先选择要导出的组件集', { error: true });
      // 通知UI更新状态
      figma.ui.postMessage({
        type: 'selection-status',
        hasSelection: false,
        componentCount: 0
      });
      return;
    }

    // 过滤出组件集（ComponentSet）和组件（Component）
    const components: SceneNode[] = [];
    
    selection.forEach(node => {
      if (node.type === 'COMPONENT_SET' || node.type === 'COMPONENT') {
        components.push(node);
      } else if (node.type === 'INSTANCE') {
        // 如果是实例，获取其主组件
        const mainComponent = node.mainComponent;
        if (mainComponent) {
          components.push(mainComponent);
        }
      } else if ('children' in node) {
        // 如果是组或框架，递归查找其中的组件
        findComponentsInNode(node, components);
      }
    });

    if (components.length === 0) {
      figma.notify('选中的内容中没有找到组件或组件集', { error: true });
      // 通知UI更新状态
      figma.ui.postMessage({
        type: 'selection-status',
        hasSelection: true,
        componentCount: 0
      });
      return;
    }

    // 去重（基于节点ID）
    const uniqueComponents = Array.from(
      new Map(components.map(comp => [comp.id, comp])).values()
    );

    figma.notify(`找到 ${uniqueComponents.length} 个组件，开始导出所有变体...`);

    // 导出每个组件，收集所有文件
    const exportPromises = uniqueComponents.map(async (component) => {
      return await exportComponentAsSVG(component);
    });

    const allFilesArrays = await Promise.all(exportPromises);
    
    // 扁平化文件数组
    const allFiles: { fileName: string; content: string }[] = [];
    allFilesArrays.forEach(files => {
      allFiles.push(...files);
    });
    
    if (allFiles.length === 0) {
      figma.notify('没有成功导出任何文件', { error: true });
      figma.ui.postMessage({
        type: 'export-error',
        error: '没有成功导出任何文件'
      });
      return;
    }
    
    figma.notify(`成功导出 ${allFiles.length} 个变体为SVG文件！`);
    
    // 将所有文件发送到UI，让UI打包成ZIP
    figma.ui.postMessage({
      type: 'export-complete',
      count: allFiles.length,
      files: allFiles
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    figma.notify(`导出失败: ${errorMessage}`, { error: true });
    console.error('导出错误:', error);
    
    // 通知UI导出失败
    figma.ui.postMessage({
      type: 'export-error',
      error: errorMessage
    });
  }
}

