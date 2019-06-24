export interface IQueryPart {
    literal?: string;
    hasArgument?: boolean;
    argument?: any;
}

export class QueryFragments {

    public readonly fragments: TemplatedQuery[] = [];

    public readonly prefix: string;

    public readonly separator: string;

    constructor(
        separator: string,
        prefix?: string) {
        this.prefix = prefix;
        this.separator = separator;
    }

    public add(query: TemplateStringsArray, ... args: any[]): QueryFragments;
    public add(query: TemplatedQuery | TemplateStringsArray, ... args: any[]): QueryFragments {
        if (!(query instanceof TemplatedQuery)) {
            query = TemplatedQuery.create(query, args);
        }
        this.fragments.push(query);
        return this;
    }

    public toQuery(): TemplatedQuery {
        const f = [];
        if (this.prefix) {
            f.push({ literal: this.prefix });
        }
        let i = 0;
        for (const iterator of this.fragments) {
            if (i++) {
                f.push({ literal: this.separator });
            }
            f.push(iterator);
        }
        return new TemplatedQuery(f);
    }

}

export default class TemplatedQuery {

    public static create(query: TemplateStringsArray, ... args: any[]): TemplatedQuery {
        const q = new TemplatedQuery(null);
        for (let index = 0; index < args.length; index++) {
            const element = args[index];
            const raw = query.raw[index];
            if (raw) {
                q.fragments.push({ literal: raw });
            }
            q.fragments.push({ hasArgument: true, argument: element });
        }
        const last = query.raw[args.length];
        if (last) {
            q.fragments.push({ literal: last });
        }
        return q;
    }

    public static fragments(separator: string): QueryFragments;
    public static fragments(prefix: string, separator?: string): QueryFragments {
        return new QueryFragments(separator ? separator : prefix, prefix);
    }

    private fragments: IQueryPart[] = [];

    constructor(fragments: IQueryPart[]);
    constructor(text: string | IQueryPart[], args?: any[]) {
        if (!text) {
            return;
        }

        if (typeof text !== "string" && Array.isArray(text)) {
            this.fragments = text;
            return;
        }

        if (!args) {
            return;
        }
        for (let i = 0; i < args.length; i++) {
            const sep = `{${i}}`;
            const index = text.indexOf(sep);

            const prefix = text.substring(0, index);
            text = text.substring(index + sep.length);
            const arg = args[i];
            this.fragments.push({ literal: prefix });
            if (arg instanceof TemplatedQuery) {
                this.fragments = this.fragments.concat(arg.fragments);
            } else if (arg instanceof QueryFragments) {
                const qf = arg.toQuery();
                this.fragments = this.fragments.concat(qf.fragments);
            } else if (typeof arg !== "string" && Array.isArray(arg)) {
                let i2 = 0;
                for (const iterator of arg) {
                    if (i2++) {
                        this.fragments.push({ literal: "," });
                    }
                    this.fragments.push({ hasArgument: true, argument: iterator });
                }
            } else {
                this.fragments.push({ hasArgument: true, argument: arg});
            }
        }
        this.fragments.push({ literal: text });
    }

    public toQuery(prefix?: string): IQuery {
        const args: {[key: string]: any} = {};
        prefix = prefix || "@p";
        let s = "";
        let i = 0;
        for (const iterator of this.fragments) {
            if (iterator.hasArgument) {
                const a = prefix + i;
                args[a] = iterator.argument;
                i++;
                s += a;
            } else {
                s += iterator.literal;
            }
        }
        return {
            command: s,
            arguments: args
        };
    }
}

export interface IQuery {
    command: string;
    arguments: {[key: string]: any};
}
