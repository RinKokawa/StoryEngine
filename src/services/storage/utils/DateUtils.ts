/**
 * 日期处理工具模块
 * 提供统一的日期计算和格式化功能
 */

export class DateUtils {
  /**
   * 获取今天的日期字符串 (YYYY-MM-DD)
   * @returns 今天的日期字符串
   */
  static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 获取指定日期的字符串格式
   * @param date 日期对象
   * @returns 日期字符串 (YYYY-MM-DD)
   */
  static getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 获取本周的开始日期（周日）
   * @param date 参考日期，默认为今天
   * @returns 本周开始日期
   */
  static getWeekStart(date: Date = new Date()): Date {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * 获取本周的结束日期（周六）
   * @param date 参考日期，默认为今天
   * @returns 本周结束日期
   */
  static getWeekEnd(date: Date = new Date()): Date {
    const weekEnd = new Date(date);
    weekEnd.setDate(date.getDate() - date.getDay() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  /**
   * 获取本周的所有日期字符串
   * @param date 参考日期，默认为今天
   * @returns 本周日期字符串数组
   */
  static getWeekDates(date: Date = new Date()): string[] {
    const weekStart = this.getWeekStart(date);
    const dates: string[] = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      dates.push(this.getDateString(currentDate));
    }
    
    return dates;
  }

  /**
   * 计算本周的总数值
   * @param dailyData 每日数据记录 {日期: 数值}
   * @param date 参考日期，默认为今天
   * @returns 本周总数值
   */
  static calculateWeekTotal(dailyData: Record<string, number>, date: Date = new Date()): number {
    const weekDates = this.getWeekDates(date);
    return weekDates.reduce((total, dateStr) => total + (dailyData[dateStr] || 0), 0);
  }

  /**
   * 计算本月的总数值
   * @param dailyData 每日数据记录 {日期: 数值}
   * @param date 参考日期，默认为今天
   * @returns 本月总数值
   */
  static calculateMonthTotal(dailyData: Record<string, number>, date: Date = new Date()): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    let total = 0;
    for (let d = monthStart.getDate(); d <= monthEnd.getDate(); d++) {
      const currentDate = new Date(year, month, d);
      const dateStr = this.getDateString(currentDate);
      total += dailyData[dateStr] || 0;
    }
    
    return total;
  }

  /**
   * 获取日期范围内的所有日期
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 日期字符串数组
   */
  static getDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(this.getDateString(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * 检查两个日期是否在同一天
   * @param date1 日期1
   * @param date2 日期2
   * @returns 是否同一天
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return this.getDateString(date1) === this.getDateString(date2);
  }

  /**
   * 检查日期是否在本周内
   * @param date 要检查的日期
   * @param referenceDate 参考日期，默认为今天
   * @returns 是否在本周内
   */
  static isInCurrentWeek(date: Date, referenceDate: Date = new Date()): boolean {
    const weekStart = this.getWeekStart(referenceDate);
    const weekEnd = this.getWeekEnd(referenceDate);
    return date >= weekStart && date <= weekEnd;
  }

  /**
   * 格式化相对时间
   * @param date 日期
   * @returns 相对时间字符串
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}周前`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}年前`;
    }
  }
}