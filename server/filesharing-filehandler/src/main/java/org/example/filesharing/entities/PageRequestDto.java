package org.example.filesharing.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageRequestDto<TRequest> {
    private Integer maxResultCount = 10;
    private Integer skipCount = 0;
    private String sorting;
    private TRequest filter;

    @JsonIgnore
    public PageRequest getPageRequest() {
        int pageIndex = 0;
        if (maxResultCount == null || this.maxResultCount <= 0) {
            this.maxResultCount = 10;
        }
        if (this.skipCount == null || this.skipCount < 0) {
            this.skipCount = 0;
        }
        Integer pageSize = this.maxResultCount;
        pageIndex = ((skipCount) / maxResultCount);
        return PageRequest.of(pageIndex, pageSize, getSort());
    }

    @JsonIgnore
    public Sort getSort() {
        if (StringUtils.isNullOrEmpty(sorting)) {
            return Sort.unsorted();
        }
        String[] sortFields = sorting.split(",");
        Sort sort = Sort.unsorted();
        for (String field : sortFields) {
            String[] parts = field.trim().split("\\s+");
            if (parts.length == 2) {
                Sort.Direction direction = parts[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
                sort = sort.and(Sort.by(direction, parts[0]));
            } else {
                sort = sort.and(Sort.by(parts[0])); // Mặc định ASC nếu không có chỉ định
            }
        }
        return sort;
    }

//    @JsonIgnore
//    public String getFts() {
//        if (StringUtils.isNullOrEmpty(filter)) {
//            return null;
//        }
//        return StringUtils.removeVietnameseAccents(filter).trim().toLowerCase();
//    }
}
