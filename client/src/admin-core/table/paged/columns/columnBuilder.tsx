/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type ColumnType} from 'antd/es/table/interface';
import {
    type BooleanColumnOptions,
    type DateColumnOptions,
    type ImageColumnOptions,
    type NumberColumnOptions,
    type TextColumnOptions
} from './types';
import {TextRender} from './renders/textRender';
import {NumberRender} from './renders/numberRender';
import {DateRender} from './renders/dateRender';
import {BooleanRender} from './renders/booleanRender';
import {ImageRender} from './renders/imageRender';

export class ColumnBuilder<T = any> {
    private columns: ColumnType<T>[] = [];

    // Add number column with copyable support
    addNumber(config: NumberColumnOptions): this {
        const fullConfig = {...config};

        this.columns.push({
            ...fullConfig,
            align: config.align || 'right',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            render: config.render || ((value: any, record: T, index: number) =>
                    NumberRender.render(value, record, fullConfig)
            )
        });
        return this;
    }

    // Add date column with copyable support
    addDate(config: DateColumnOptions): this {
        const fullConfig = {...config};

        this.columns.push({
            ...fullConfig,
            align: config.align || 'center',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            render: config.render || ((value: any, record: T, index: number) =>
                    DateRender.render(value, record, fullConfig)
            )
        });
        return this;
    }

    // Add text column with copyable support
    addText(config: TextColumnOptions): this {
        const fullConfig = {...config};

        this.columns.push({
            ...fullConfig,
            align: config.align || 'left',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            render: config.render || ((value: any, record: T, index: number) =>
                    TextRender.render(value, record, fullConfig)
            )
        });
        return this;
    }

    // Add boolean column with copyable support
    addBoolean(config: BooleanColumnOptions): this {
        const fullConfig = {...config};

        this.columns.push({
            ...fullConfig,
            align: config.align || 'center',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            render: config.render || ((value: any, record: T, index: number) =>
                    BooleanRender.render(value, record, fullConfig)
            )
        });
        return this;
    }

    // Add image column with copyable support (copy URL)
    addImage(config: ImageColumnOptions): this {
        const fullConfig = {...config};

        this.columns.push({
            ...fullConfig,
            align: config.align || 'center',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            render: config.render || ((value: any, record: T, index: number) =>
                    ImageRender.render(value, record, fullConfig)
            )
        });
        return this;
    }

    // Add custom column with full control
    addCustom(column: ColumnType<T>): this {
        this.columns.push(column);
        return this;
    }

    // Build columns
    build(): ColumnType<T>[] {
        return this.columns;
    }

    // Reset builder
    reset(): this {
        this.columns = [];
        return this;
    }

    // Get current columns count
    getColumnsCount(): number {
        return this.columns.length;
    }

    // Remove last column
    removeLast(): this {
        this.columns.pop();
        return this;
    }

    // Insert column at specific position
    insertAt(index: number, column: ColumnType<T>): this {
        this.columns.splice(index, 0, column);
        return this;
    }

    // Remove column by key
    removeByKey(key: string): this {
        this.columns = this.columns.filter(col => col.key !== key);
        return this;
    }

    // Update column by key
    updateByKey(key: string, updates: Partial<ColumnType<T>>): this {
        const index = this.columns.findIndex(col => col.key === key);
        if (index !== -1) {
            this.columns[index] = {...this.columns[index], ...updates};
        }
        return this;
    }

    // Get column by key
    getByKey(key: string): ColumnType<T> | undefined {
        return this.columns.find(col => col.key === key);
    }

    // Reorder columns
    reorder(fromIndex: number, toIndex: number): this {
        const [removed] = this.columns.splice(fromIndex, 1);
        this.columns.splice(toIndex, 0, removed);
        return this;
    }

    // Clone builder
    clone(): ColumnBuilder<T> {
        const newBuilder = new ColumnBuilder<T>();
        newBuilder.columns = [...this.columns];
        return newBuilder;
    }
}
