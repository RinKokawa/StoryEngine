/**
 * 简单的依赖注入容器
 * 提升服务的测试性和灵活性
 */

export type ServiceFactory<T = any> = (...args: any[]) => T;
export type ServiceConstructor<T = any> = new (...args: any[]) => T;

export interface ServiceDefinition<T = any> {
  factory?: ServiceFactory<T>;
  constructor?: ServiceConstructor<T>;
  instance?: T;
  singleton?: boolean;
  dependencies?: string[];
}

export class DIContainer {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();

  /**
   * 注册单例服务
   */
  registerSingleton<T>(
    name: string, 
    constructor: ServiceConstructor<T>, 
    dependencies: string[] = []
  ): void {
    this.services.set(name, {
      constructor,
      singleton: true,
      dependencies
    });
  }

  /**
   * 注册瞬态服务
   */
  registerTransient<T>(
    name: string, 
    constructor: ServiceConstructor<T>, 
    dependencies: string[] = []
  ): void {
    this.services.set(name, {
      constructor,
      singleton: false,
      dependencies
    });
  }

  /**
   * 注册工厂服务
   */
  registerFactory<T>(
    name: string, 
    factory: ServiceFactory<T>, 
    singleton: boolean = true
  ): void {
    this.services.set(name, {
      factory,
      singleton,
      constructor: undefined,
      instance: undefined,
      dependencies: undefined
    });
  }

  /**
   * 注册实例
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, { 
      instance,
      factory: undefined,
      constructor: undefined,
      singleton: undefined,
      dependencies: undefined
    });
    this.instances.set(name, instance);
  }

  /**
   * 解析服务
   */
  resolve<T>(name: string): T {
    const definition = this.services.get(name);
    if (!definition) {
      throw new Error(`Service '${name}' not registered`);
    }

    // 如果已经有实例且是单例，直接返回
    if (definition.singleton && this.instances.has(name)) {
      return this.instances.get(name);
    }

    // 如果是预注册的实例
    if (definition.instance) {
      return definition.instance;
    }

    let instance: T;

    // 使用工厂创建
    if (definition.factory) {
      instance = definition.factory();
    }
    // 使用构造函数创建
    else if (definition.constructor) {
      const dependencies = this.resolveDependencies(definition.dependencies || []);
      instance = new definition.constructor(...dependencies);
    }
    else {
      throw new Error(`No factory or constructor defined for service '${name}'`);
    }

    // 如果是单例，缓存实例
    if (definition.singleton) {
      this.instances.set(name, instance);
    }

    return instance;
  }

  /**
   * 解析依赖
   */
  private resolveDependencies(dependencies: string[]): any[] {
    return dependencies.map(dep => this.resolve(dep));
  }

  /**
   * 检查服务是否已注册
   */
  isRegistered(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * 清除所有实例（用于测试）
   */
  clearInstances(): void {
    this.instances.clear();
  }

  /**
   * 获取所有注册的服务名称
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 创建子容器
   */
  createChild(): DIContainer {
    const child = new DIContainer();
    // 复制父容器的服务定义
    for (const [name, definition] of this.services.entries()) {
      child.services.set(name, { ...definition });
    }
    return child;
  }
}

/**
 * 全局容器实例
 */
export const container = new DIContainer();

/**
 * 装饰器：标记为可注入的服务
 */
export function Injectable(name?: string) {
  return function <T extends ServiceConstructor>(constructor: T) {
    const serviceName = name || constructor.name;
    container.registerSingleton(serviceName, constructor);
    return constructor;
  };
}

/**
 * 装饰器：注入依赖
 */
export function Inject(serviceName: string) {
  return function (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 这里可以实现参数注入的逻辑
    // 由于TypeScript装饰器的限制，这里提供一个简化版本
    // 注意：需要安装 reflect-metadata 包才能使用 Reflect.getMetadata
    console.log(`Injecting ${serviceName} at parameter ${parameterIndex} for ${target.name}`);
    // const existingTokens = Reflect.getMetadata('design:paramtypes', target) || [];
    // existingTokens[parameterIndex] = serviceName;
    // Reflect.defineMetadata('design:paramtypes', existingTokens, target);
  };
}