import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { ApiError } from '../api/baseApi';
import {
    proofApi,
    type ProofAssetItem,
    type ProofLanding,
    type ProofSession,
} from '../api/proofApi';

export type ProofPhase = 'loading' | 'error' | 'name' | 'gallery' | 'submitted';
export type ProofFilter = 'all' | 'selected';

interface PersistedState {
    guestKey: string;
    guestName: string;
    selected: string[];
    submitted: boolean;
}

const PAGE_SIZE = 100;

// Store rieng cho trang guest, khong nam trong rootStore
export class ProofGuestStore {
    shareToken: string;
    phase: ProofPhase = 'loading';
    errorCode: string | null = null;
    landing: ProofLanding | null = null;
    session: ProofSession | null = null;
    assets: ProofAssetItem[] = [];
    selected: Set<string> = new Set();
    filter: ProofFilter = 'all';
    isSubmitting = false;
    isCreatingSession = false;

    constructor(shareToken: string) {
        this.shareToken = shareToken;
        makeObservable(this, {
            phase: observable,
            errorCode: observable,
            landing: observable,
            session: observable,
            assets: observable.shallow,
            selected: observable,
            filter: observable,
            isSubmitting: observable,
            isCreatingSession: observable,
            visibleAssets: computed,
            selectedCount: computed,
            init: action,
            enterName: action,
            toggle: action,
            setFilter: action,
            submit: action,
        });
    }

    private get storageKey() {
        return `proof:${this.shareToken}`;
    }

    private readPersisted(): PersistedState | null {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? (JSON.parse(raw) as PersistedState) : null;
        } catch {
            return null;
        }
    }

    private persist(submitted = false) {
        if (!this.session) return;
        try {
            const state: PersistedState = {
                guestKey: this.session.guestKey,
                guestName: this.session.guestName,
                selected: [...this.selected],
                submitted,
            };
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch {
            // localStorage bi chan thi van dung duoc trong phien hien tai
        }
    }

    private clearPersisted() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch {
            // bo qua
        }
    }

    get visibleAssets(): ProofAssetItem[] {
        return this.filter === 'selected'
            ? this.assets.filter((a) => this.selected.has(a.assetId))
            : this.assets;
    }

    get selectedCount() {
        return this.selected.size;
    }

    async init() {
        this.phase = 'loading';
        try {
            const landing = await proofApi.getLanding(this.shareToken);
            runInAction(() => {
                this.landing = landing;
            });
        } catch (e) {
            this.fail(e);
            return;
        }

        const saved = this.readPersisted();
        if (!saved?.guestKey) {
            runInAction(() => {
                this.phase = 'name';
            });
            return;
        }

        runInAction(() => {
            this.session = { guestKey: saved.guestKey, guestName: saved.guestName };
            this.selected = new Set(saved.selected ?? []);
        });
        try {
            await this.loadAllAssets(saved.guestKey);
            runInAction(() => {
                // bo id khong con trong gallery (anh da bi go)
                const ids = new Set(this.assets.map((a) => a.assetId));
                this.selected = new Set([...this.selected].filter((id) => ids.has(id)));
                this.phase = saved.submitted ? 'submitted' : 'gallery';
            });
        } catch (e) {
            if (e instanceof ApiError && e.code === '5603') {
                // phien khong hop le: xoa khoa local, quay ve form ten
                this.clearPersisted();
                runInAction(() => {
                    this.session = null;
                    this.selected = new Set();
                    this.phase = 'name';
                });
                return;
            }
            this.fail(e);
        }
    }

    async enterName(guestName: string): Promise<void> {
        runInAction(() => {
            this.isCreatingSession = true;
        });
        try {
            const session = await proofApi.createSession(this.shareToken, guestName);
            await this.loadAllAssets(session.guestKey);
            runInAction(() => {
                this.session = session;
                this.selected = new Set();
                this.phase = 'gallery';
            });
            this.persist();
        } finally {
            runInAction(() => {
                this.isCreatingSession = false;
            });
        }
    }

    private async loadAllAssets(guestKey: string) {
        const all: ProofAssetItem[] = [];
        let page = 0;
        for (;;) {
            const result = await proofApi.getAssets(this.shareToken, guestKey, page, PAGE_SIZE);
            all.push(...result.data);
            page += 1;
            // totalCount tinh tren asset nen trang co the ngan hon PAGE_SIZE
            if (page * PAGE_SIZE >= result.totalCount) break;
        }
        runInAction(() => {
            this.assets = all;
        });
    }

    toggle(assetId: string) {
        if (this.phase !== 'gallery') return;
        const next = new Set(this.selected);
        if (next.has(assetId)) next.delete(assetId);
        else next.add(assetId);
        this.selected = next;
        this.persist();
    }

    setFilter(filter: ProofFilter) {
        this.filter = filter;
    }

    // Loi giu nguyen danh sach chon de gui lai; chi PROOF_ALREADY_SUBMITTED duoc coi la da gui
    async submit(note?: string): Promise<void> {
        if (!this.session) return;
        runInAction(() => {
            this.isSubmitting = true;
        });
        try {
            await proofApi.submit(this.shareToken, this.session.guestKey, [...this.selected], note);
            runInAction(() => {
                this.phase = 'submitted';
            });
            this.persist(true);
        } catch (e) {
            if (e instanceof ApiError && e.code === '5604') {
                runInAction(() => {
                    this.phase = 'submitted';
                });
                this.persist(true);
                return;
            }
            throw e;
        } finally {
            runInAction(() => {
                this.isSubmitting = false;
            });
        }
    }

    fail(e: unknown) {
        runInAction(() => {
            this.errorCode = e instanceof ApiError ? e.code : 'UNKNOWN_ERROR';
            this.phase = 'error';
        });
    }
}
