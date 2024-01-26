import * as cdk from '@aws-cdk/core';

export class ResourceName {
    public readonly systemName: string;
    public readonly systemEnv: string;

    constructor(system_name: string, env: string) {
        this.systemName = system_name;
        this.systemEnv = env;
    }

    private generate(suffix: string): string {
        return `${this.systemName}-${this.systemEnv}-${suffix}`;
    }

    public stackName(name: string): string {
        return this.generate(`${name}-stack`);
    }

    public tableName(name: string): string {
        return this.generate(`${name}-table`);
    }

    public lambdaName(name: string): string {
        return this.generate(`${name}-function`);
    }

    public apiName(name: string): string {
        return this.generate(`${name}-api`);
    }

    public roleName(name: string): string {
        return this.generate(`${name}-role`);
    }
    public ssmParamName(name: string): string {
        return `/${this.systemName}/${this.systemEnv}/${name}`;
    }

    public generalName(name: string): string {
        return this.generate(`${name}`);
    }
}
