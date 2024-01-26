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

    public bucketName(name: string): string {
        return this.generate(`${name}-bukcet`).toLowerCase();
    }

    public keyName(name: string): string {
        return this.generate(`${name}-key`);
    }

    public lambdaName(name: string): string {
        return this.generate(`${name}-function`);
    }

    public roleName(name: string): string {
        return this.generate(`${name}-role`);
    }

    public ecrReposName(name: string): string {
        return `${this.systemName}/${this.systemEnv}/${name}`.toLowerCase();
    }

    public ssmParamName(name: string): string {
        return `/${this.systemName}/${this.systemEnv}/${name}`;
    }

    public generalName(name: string): string {
        return this.generate(`${name}`);
    }

    public cfnSystemTags() {
        return {system: this.systemName, env: this.systemEnv};
    }
}

export function addNameTag(scope: cdk.Construct, name: string, props?: cdk.TagProps | undefined) {
    cdk.Tags.of(scope).add("Name", name, props);
}
