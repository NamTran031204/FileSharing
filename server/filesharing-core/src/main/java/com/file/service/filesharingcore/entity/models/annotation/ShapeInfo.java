package com.file.service.filesharingcore.entity.models.annotation;

import com.file.service.filesharingcore.enums.Shape;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShapeInfo {
    private String shapeId; // lay tu frontend
    private Shape shape;

    /**
     * rect: x,y,width,height
     * text: x,y,width,height,text,fontSize
     * circle: x,y,radius
     * arrow: x,y,x2,y2
     * dot: x,y
     */

    // attribute
    private double x;
    private double y;
    private Double width;        // RECT, TEXT (text box width)
    private Double height;       // RECT, TEXT
    private Double radius;       // CIRCLE
    private Double x2;           // ARROW điểm cuối
    private Double y2;           // ARROW
    private String text;         // TEXT — nội dung text dán
    private Double fontSize;     // TEXT — pixel world

    // chung cho shape
    private String stroke;
    private String strokeColor;
    private Integer strokeWidth;
    private String fillColor; // riêng cho màu chữ
}