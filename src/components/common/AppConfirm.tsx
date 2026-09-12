import React from 'react'
import { Modal, type ModalFuncProps } from 'antd'
import {
    CheckCircleFilled,
    ExclamationCircleFilled,
    InfoCircleFilled,
    WarningFilled,
} from '@ant-design/icons'
import { colors } from '../../lib/designTokens'

export type ConfirmColor =
    | 'primary'
    | 'green'
    | 'danger'
    | 'red'
    | 'warning'
    | 'amber'
    | 'info'
    | 'blue'
    | (string & {})

export interface AppConfirmProps extends Omit<ModalFuncProps, 'icon'> {
    title: React.ReactNode
    content?: React.ReactNode
    okText?: string
    cancelText?: string
    /**
     * Color of the OK confirmation button.
     * Defaults to 'green' (system primary: #15803d).
     * Can also be 'danger' | 'red', 'warning' | 'amber', or any custom hex color.
     */
    okColor?: ConfirmColor
    /**
     * Background/border color of the Cancel button.
     * Defaults to system gray (#f3f4f6).
     */
    cancelColor?: string
    icon?: React.ReactNode
    onOk?: (...args: any[]) => any
    onCancel?: (...args: any[]) => any
}

const resolveOkStyles = (color: ConfirmColor = 'green') => {
    switch (color) {
        case 'green':
        case 'primary':
            return {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                color: '#ffffff',
                iconColor: colors.primary,
            }
        case 'red':
        case 'danger':
            return {
                backgroundColor: colors.error,
                borderColor: colors.error,
                color: '#ffffff',
                iconColor: colors.error,
            }
        case 'amber':
        case 'warning':
            return {
                backgroundColor: colors.warning,
                borderColor: colors.warning,
                color: '#ffffff',
                iconColor: colors.warning,
            }
        case 'blue':
        case 'info':
            return {
                backgroundColor: colors.info,
                borderColor: colors.info,
                color: '#ffffff',
                iconColor: colors.info,
            }
        default:
            return {
                backgroundColor: color,
                borderColor: color,
                color: '#ffffff',
                iconColor: color,
            }
    }
}

/**
 * System-wide consistent confirmation popup.
 * Displays a green OK button by default and a neutral gray Cancel button.
 * Button colors and styles are configurable via props.
 */
export function appConfirm({
    title,
    content,
    okText = 'Confirm',
    cancelText = 'Cancel',
    okColor = 'green',
    cancelColor,
    icon,
    okButtonProps,
    cancelButtonProps,
    centered = true,
    width = 440,
    ...rest
}: AppConfirmProps) {
    const okStyles = resolveOkStyles(okColor)

    const resolvedIcon =
        icon !== undefined ? (
            icon
        ) : okColor === 'red' || okColor === 'danger' ? (
            <ExclamationCircleFilled style={{ color: colors.error, fontSize: 22 }} />
        ) : okColor === 'amber' || okColor === 'warning' ? (
            <WarningFilled style={{ color: colors.warning, fontSize: 22 }} />
        ) : okColor === 'blue' || okColor === 'info' ? (
            <InfoCircleFilled style={{ color: colors.info, fontSize: 22 }} />
        ) : (
            <CheckCircleFilled style={{ color: colors.primary, fontSize: 22 }} />
        )

    return Modal.confirm({
        title: (
            <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
                {title}
            </span>
        ),
        content: content ? (
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                {content}
            </div>
        ) : undefined,
        icon: resolvedIcon,
        okText,
        cancelText,
        centered,
        width,
        autoFocusButton: null,
        okButtonProps: {
            ...okButtonProps,
            style: {
                backgroundColor: okStyles.backgroundColor,
                borderColor: okStyles.borderColor,
                color: okStyles.color,
                fontWeight: 500,
                borderRadius: 6,
                boxShadow: 'none',
                height: 36,
                padding: '0 16px',
                ...okButtonProps?.style,
            },
        },
        cancelButtonProps: {
            ...cancelButtonProps,
            style: {
                backgroundColor: cancelColor || '#f3f4f6',
                borderColor: cancelColor || '#e5e7eb',
                color: '#374151',
                fontWeight: 500,
                borderRadius: 6,
                boxShadow: 'none',
                height: 36,
                padding: '0 16px',
                ...cancelButtonProps?.style,
            },
        },
        ...rest,
    })
}

export default appConfirm
