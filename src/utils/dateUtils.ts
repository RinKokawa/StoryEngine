/**
 * 日期工具模块
 * 提供通用的日期处理和计算功能
 */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface WeekInfo {
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  year: number;
}

export class DateUtils {
  /**
   * 获取今天的日期字符串 (YYYY-MM-DD)
   */
  static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 获取指定日期的字符串 (YYYY-MM-DD)
   */
  static getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 从日期字符串创建Date对象
   */
  static fromDateString(dateString: string): Date {
    return new Date(dateString + 'T00:00:00.000Z');
  }

  /**
   * 获取本周的开始和结束日期
   * @param startOfWeek 一周的开始日期 (0=周日, 1=周一)
   */
  static getCurrentWeek(startOfWeek: number = 0): DateRange {
    const now = new Date();
    const currentDay = now.getDay();
    const diff = currentDay - startOfWeek;
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { start: weekStart, end: weekEnd };
  }

  /**
   * 获取指定日期所在周的信息
   */
  static getWeekInfo(date: Date, startOfWeek: number = 0): WeekInfo {
    const currentDay = date.getDay();
    const diff = currentDay - startOfWeek;
    
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // 计算周数（ISO 8601标准）
    const weekNumber = this.getWeekNumber(date);
    
    return {
      weekStart,
      weekEnd,
      weekNumber,
      year: date.getFullYear()
    };
  }

  /**
   * 获取本月的开始和结束日期
   */
  static getCurrentMonth(): DateRange {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return { start: monthStart, end: monthEnd };
  }

  /**
   * 获取本年的开始和结束日期
   */
  static getCurrentYear(): DateRange {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    
    return { start: yearStart, end: yearEnd };
  }

  /**
   * 计算两个日期之间的天数
   */
  static getDaysBetween(start: Date, end: Date): number {
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * 获取日期范围内的所有日期字符串
   */
  static getDateStringsInRange(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(this.getDateString(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * 获取ISO周数
   */
  static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * 检查日期是否在指定范围内
   */
  static isDateInRange(date: Date, range: DateRange): boolean {
    return date >= range.start && date <= range.end;
  }

  /**
   * 格式化日期为可读字符串
   */
  static formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
    };

    const options = optionsMap[format];
    return date.toLocaleDateString('zh-CN', options);
  }

  /**
   * 获取相对时间描述
   */
  static getRelativeTime(date: Date): string {
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

/**
 * 写作统计专用的日期工具
 */
export class WritingDateUtils extends DateUtils {
  /**
   * 计算指定日期范围内的总字数
   */
  static calculateWordsInRange(
    dailyWords: Record<string, number>, 
    range: DateRange
  ): number {
    const dateStrings = this.getDateStringsInRange(range.start, range.end);
    return dateStrings.reduce((total, dateStr) => {
      return total + (dailyWords[dateStr] || 0);
    }, 0);
  }

  /**
   * 计算本周写作字数
   */
  static calculateWeekWords(dailyWords: Record<string, number>): number {
    const weekRange = this.getCurrentWeek(0); // 周日开始
    return this.calculateWordsInRange(dailyWords, weekRange);
  }

  /**
   * 计算本月写作字数
   */
  static calculateMonthWords(dailyWords: Record<string, number>): number {
    const monthRange = this.getCurrentMonth();
    return this.calculateWordsInRange(dailyWords, monthRange);
  }

  /**
   * 计算本年写作字数
   */
  static calculateYearWords(dailyWords: Record<string, number>): number {
    const yearRange = this.getCurrentYear();
    return this.calculateWordsInRange(dailyWords, yearRange);
  }

  /**
   * 获取写作连续天数
   */
  static getWritingStreak(dailyWords: Record<string, number>): number {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = this.getDateString(currentDate);
      const words = dailyWords[dateStr] || 0;
      
      if (words > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 获取最活跃的写作日期
   */
  static getMostActiveWritingDays(
    dailyWords: Record<string, number>, 
    limit: number = 10
  ): Array<{ date: string; words: number }> {
    return Object.entries(dailyWords)
      .map(([date, words]) => ({ date, words }))
      .sort((a, b) => b.words - a.words)
      .slice(0, limit);
  }

  /**
   * 计算平均每日字数
   */
  static calculateAverageDailyWords(
    dailyWords: Record<string, number>,
    range?: DateRange
  ): number {
    let totalWords = 0;
    let activeDays = 0;

    const entries = Object.entries(dailyWords);
    
    for (const [dateStr, words] of entries) {
      if (range) {
        const date = this.fromDateString(dateStr);
        if (!this.isDateInRange(date, range)) {
          continue;
        }
      }
      
      if (words > 0) {
        totalWords += words;
        activeDays++;
      }
    }

    return activeDays > 0 ? Math.round(totalWords / activeDays) : 0;
  }

  /**
   * 生成写作日历数据
   */
  static generateWritingCalendar(
    dailyWords: Record<string, number>,
    year: number,
    month: number
  ): WritingCalendarDay[] {
    const calendar: WritingCalendarDay[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.getDateString(date);
      const words = dailyWords[dateStr] || 0;

      calendar.push({
        date: dateStr,
        day,
        words,
        hasWriting: words > 0,
        isToday: dateStr === this.getTodayString()
      });
    }

    return calendar;
  }
}

export interface WritingCalendarDay {
  date: string;
  day: number;
  words: number;
  hasWriting: boolean;
  isToday: boolean;
}