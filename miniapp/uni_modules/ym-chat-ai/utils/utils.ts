/**
 * 字符串工具类
 */
export class StringUtils {
  /**
   * 检查字符串是否为空或仅包含空白字符
   * @param str 字符串
   * @returns 是否为空
   */
  static isNotEmpty(str: string): boolean {
    return str != null && str.trim().length > 0;
  }

  /**
   * 检查字符串是否为空或仅包含空白字符
   * @param str 字符串
   * @returns 是否为空
   */
  static isEmpty(str: string): boolean {
    return !this.isNotEmpty(str);
  }
}

/**
 * 平台工具类
 */
export class PlatformUtils {
  /**
   * 显示Toast提示
   * @param title 提示内容
   * @param icon 图标类型
   * @param duration 显示时长
   */
  static showToast(title: string, icon: 'success' | 'error' | 'none' = 'none', duration: number = 1500): void {
    // @ts-ignore
    if (typeof uni !== 'undefined' && uni.showToast) {
      // @ts-ignore
      uni.showToast({ title, icon, duration });
    } else {
      console.log('Toast:', title);
    }
  }

  /**
   * 震动反馈
   * @param type 震动类型
   */
  static vibrate(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    // @ts-ignore
    if (typeof uni !== 'undefined' && uni.vibrateShort) {
      if (type === 'light') {
        // @ts-ignore
        uni.vibrateShort({ type: 'light' });
      } else if (type === 'medium') {
        // @ts-ignore
        uni.vibrateShort({ type: 'medium' });
      } else {
        // @ts-ignore
        uni.vibrateLong();
      }
    }
  }
}

/**
 * 文件工具类
 */
export class FileUtils {
  /**
   * 生成文件ID
   * @returns 文件ID
   */
  static generateFileId(): string {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取文件扩展名
   * @param filename 文件名
   * @returns 文件扩展名
   */
  static getExtension(filename: string): string {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}

/**
 * 日期工具类
 */
export class DateUtils {
  /**
   * 判断是否为今天
   * @param date 日期
   * @returns 是否为今天
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  /**
   * 判断是否为昨天
   * @param date 日期
   * @returns 是否为昨天
   */
  static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
  }

  /**
   * 格式化时间
   * @param date 日期
   * @param format 格式
   * @returns 格式化后的时间字符串
   */
  static formatTime(date: Date, format: string): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
}

/**
 * 数字工具类
 */
export class NumberUtils {
  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的文件大小字符串
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}