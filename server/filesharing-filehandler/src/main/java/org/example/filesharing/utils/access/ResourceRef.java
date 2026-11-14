package org.example.filesharing.utils.access;

/** Tai nguyen can kiem quyen. */
public record ResourceRef(Type type, String id) {

    public enum Type { PROJECT, FOLDER, ASSET }

    public static ResourceRef project(String id) {
        return new ResourceRef(Type.PROJECT, id);
    }

    public static ResourceRef folder(String id) {
        return new ResourceRef(Type.FOLDER, id);
    }

    public static ResourceRef asset(String id) {
        return new ResourceRef(Type.ASSET, id);
    }
}
