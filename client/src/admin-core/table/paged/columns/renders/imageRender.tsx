/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from 'react';
import {CopyableWrapper} from '../utils/copyableWrapper';
import {StyleWrapper} from '../utils/styleWrapper';
import {type ImageColumnOptions} from "../types";

export class ImageRender {
    static render(value: any, record: any, config: ImageColumnOptions): React.ReactNode {
        if (!value) {
            return StyleWrapper.wrapWithStyle('', value, record, config);
        }

        const {
            imageWidth = 40,
            imageHeight = 40,
            fallbackSrc
        } = config;

        const imageElement = (
            <img
                src={value}
                alt=""
                style={{
                    width: imageWidth,
                    height: imageHeight,
                    objectFit: 'cover',
                    borderRadius: 4
                }}
                onError={(e) => {
                    if (fallbackSrc) {
                        (e.target as HTMLImageElement).src = fallbackSrc;
                    }
                }}
            />
        );

        const content = (
            <CopyableWrapper
                content={imageElement}
                copyText={value} // Copy the image URL
                config={config}
            />
        );

        return StyleWrapper.wrapWithStyle(content, value, record, config);
    }
}
