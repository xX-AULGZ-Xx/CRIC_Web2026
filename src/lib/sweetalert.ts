import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2'

// Custom themed Swal instance matching the project aesthetic
export const AppSwal = Swal.mixin({
  confirmButtonColor: '#ea580c', // Tailwind orange-600
  cancelButtonColor: '#64748b', // Tailwind slate-500
  customClass: {
    popup: 'cric-swal-popup rounded-2xl shadow-2xl font-sarabun text-slate-800',
    title: 'text-lg font-bold text-slate-800 font-sarabun',
    htmlContainer: 'text-sm text-slate-600 font-sarabun leading-relaxed',
    confirmButton: 'font-medium px-5 py-2.5 rounded-xl shadow-sm text-sm',
    cancelButton: 'font-medium px-5 py-2.5 rounded-xl shadow-sm text-sm',
    denyButton: 'font-medium px-5 py-2.5 rounded-xl shadow-sm text-sm',
  },
})

/**
 * Show Success alert
 */
export async function swalSuccess(title: string, text?: string): Promise<SweetAlertResult> {
  return AppSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#16a34a', // emerald-600
    timer: 2500,
    timerProgressBar: true,
  })
}

/**
 * Show Error alert
 */
export async function swalError(title: string, text?: string): Promise<SweetAlertResult> {
  return AppSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#dc2626', // red-600
  })
}

/**
 * Show Warning alert
 */
export async function swalWarning(title: string, text?: string): Promise<SweetAlertResult> {
  return AppSwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#ea580c', // orange-600
  })
}

/**
 * Show Info alert
 */
export async function swalInfo(title: string, text?: string): Promise<SweetAlertResult> {
  return AppSwal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#2563eb', // blue-600
  })
}

/**
 * Confirmation dialog returning boolean true if confirmed
 */
export async function swalConfirm(
  optionsOrTitle:
    | string
    | {
        title: string
        text?: string
        confirmButtonText?: string
        cancelButtonText?: string
        isDangerous?: boolean
      }
): Promise<boolean> {
  let title = ''
  let text: string | undefined
  let confirmButtonText = 'ยืนยัน'
  let cancelButtonText = 'ยกเลิก'
  let isDangerous = true

  if (typeof optionsOrTitle === 'string') {
    title = optionsOrTitle
  } else {
    title = optionsOrTitle.title
    text = optionsOrTitle.text
    if (optionsOrTitle.confirmButtonText) confirmButtonText = optionsOrTitle.confirmButtonText
    if (optionsOrTitle.cancelButtonText) cancelButtonText = optionsOrTitle.cancelButtonText
    if (optionsOrTitle.isDangerous !== undefined) isDangerous = optionsOrTitle.isDangerous
  }

  const result = await AppSwal.fire({
    title,
    text,
    icon: isDangerous ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: isDangerous ? '#dc2626' : '#ea580c',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    focusCancel: isDangerous,
  })

  return result.isConfirmed
}

/**
 * Small Toast notification in the top right
 */
export function swalToast(
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success'
) {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer
      toast.onmouseleave = Swal.resumeTimer
    },
  })

  return Toast.fire({
    icon,
    title,
  })
}

export default AppSwal
