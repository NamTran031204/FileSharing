import {action, computed, makeObservable, observable} from "mobx";

export class CommonPagingStore {
    page: number = 1;
    pageSize: number = 50;
    totalCount: number = 0;  // ✅ phải là observable vì totalPages (computed) phụ thuộc vào nó

    isLoading: boolean = false;

    constructor() {
        makeObservable(this, {
            page: observable,
            pageSize: observable,
            totalCount: observable,
            isLoading: observable,

            skipCount: computed,
            totalPages: computed,

            setPage: action,
        })
    }

    get skipCount(): number {
        return (this.page - 1) * this.pageSize;
    }

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    setPage(page: number): void {
        this.page = page;
    }
}