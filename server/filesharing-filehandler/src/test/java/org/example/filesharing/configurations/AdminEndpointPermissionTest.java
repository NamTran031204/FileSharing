package org.example.filesharing.configurations;

import org.example.filesharing.services.AdminPermission;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

// moi handler cua controller api/admin/** phai co @PreAuthorize tham chieu permission co trong AdminPermission
class AdminEndpointPermissionTest {

    @Test
    void moiHandlerAdminCoPreAuthorizeDungTenPermission() throws Exception {
        var scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
        List<String> loi = new ArrayList<>();
        int controllers = 0;
        for (BeanDefinition bd : scanner.findCandidateComponents("org.example.filesharing.controllers")) {
            Class<?> c = Class.forName(bd.getBeanClassName());
            RequestMapping rm = AnnotatedElementUtils.findMergedAnnotation(c, RequestMapping.class);
            if (rm == null || !isAdminPath(rm)) continue;
            controllers++;
            for (Method m : c.getDeclaredMethods()) {
                if (!Modifier.isPublic(m.getModifiers()) || m.isSynthetic()
                        || AnnotatedElementUtils.findMergedAnnotation(m, RequestMapping.class) == null) continue;
                PreAuthorize pa = AnnotatedElementUtils.findMergedAnnotation(m, PreAuthorize.class);
                if (pa == null) {
                    loi.add(c.getSimpleName() + "." + m.getName() + " thieu @PreAuthorize");
                } else if (AdminPermission.allNames().stream().noneMatch(n -> pa.value().contains("'" + n + "'"))) {
                    loi.add(c.getSimpleName() + "." + m.getName() + " @PreAuthorize khong chua permission trong AdminPermission: " + pa.value());
                }
            }
        }
        assertTrue(controllers >= 4, "khong quet duoc controller admin, controllers=" + controllers);
        assertTrue(loi.isEmpty(), String.join("\n", loi));
    }

    private boolean isAdminPath(RequestMapping rm) {
        String[] paths = rm.path().length > 0 ? rm.path() : rm.value();
        for (String p : paths) {
            if (p.replaceFirst("^/", "").startsWith("api/admin")) return true;
        }
        return false;
    }
}
