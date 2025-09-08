/**
 * 存储接口定义
 * 将原来的单一接口拆分为更小的专用接口
 */

/**
 * 可读存储接口
 */
export interface ReadableStorage {
  /**
   * 读取文件内容
   * @param path 文件路径
   * @returns 文件内容字符串
   */
  read(path: string): Promise<string>;
  
  /**
   * 检查文件是否存在
   * @param path 文件路径
   * @returns 是否存在
   */
  exists(path: string): Promise<boolean>;
  
  /**
   * 列出目录内容
   * @param path 目录路径
   * @returns 文件名数组
   */
  list(path?: string): Promise<string[]>;
}

/**
 * 可写存储接口
 */
export interface WritableStorage {
  /**
   * 写入文件内容
   * @param path 文件路径
   * @param data 文件内容
   */
  write(path: string, data: string): Promise<void>;
  
  /**
   * 删除文件
   * @param path 文件路径
   */
  delete(path: string): Promise<void>;
  
  /**
   * 创建目录
   * @param path 目录路径
   */
  mkdir(path: string): Promise<void>;
}

/**
 * 完整存储适配器接口
 * 继承可读和可写接口
 */
export interface StorageAdapter extends ReadableStorage, WritableStorage {
  // 兼容旧接口的方法
  readFile?(filename: string): Promise<string | null>;
  writeFile?(filename: string, data: string): Promise<void>;
  deleteFile?(filename: string): Promise<void>;
  listFiles?(): Promise<string[]>;
}