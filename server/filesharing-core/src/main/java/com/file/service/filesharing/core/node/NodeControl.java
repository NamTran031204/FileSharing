package com.file.service.filesharing.core.node;

/** Co drain cua node nay, NodeHeartbeat cap nhat moi nhip tu doc worker_nodes. */
public class NodeControl {
    private volatile boolean draining;

    public boolean isDraining() {
        return draining;
    }

    public void setDraining(boolean draining) {
        this.draining = draining;
    }
}
