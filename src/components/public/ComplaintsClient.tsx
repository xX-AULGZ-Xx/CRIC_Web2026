'use client';

import React, { useState } from 'react';

export interface PublicComplaintThreadItem {
  id: number;
  ticket_number: string;
  type: 'corruption' | 'misconduct' | null;
  title: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'rejected' | 'dismissed' | null;
  status_note: string | null;
  masked_reporter: string;
  created_at_formatted: string;
  updated_at_formatted: string;
}

interface ComplaintsClientProps {
  siteName: string;
  recentComplaints: PublicComplaintThreadItem[];
  initialTab?: 'submit' | 'track';
  initialTicket?: string;
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  pending: {
    label: 'รอดำเนินการตรวจสอบ',
    color: 'bg-amber-500 text-white',
    icon: 'fa-hourglass-start',
  },
  investigating: {
    label: 'อยู่ระหว่างการสอบสวนข้อเท็จจริง',
    color: 'bg-blue-600 text-white',
    icon: 'fa-magnifying-glass',
  },
  resolved: {
    label: 'ดำเนินการเสร็จสิ้น / ยุติเรื่อง',
    color: 'bg-emerald-600 text-white',
    icon: 'fa-circle-check',
  },
  rejected: {
    label: 'ไม่รับพิจารณา (ข้อมูลไม่เพียงพอ)',
    color: 'bg-slate-600 text-white',
    icon: 'fa-circle-xmark',
  },
  dismissed: {
    label: 'ไม่รับพิจารณา / ยุติเรื่อง',
    color: 'bg-slate-600 text-white',
    icon: 'fa-circle-xmark',
  },
};

const THREAD_BADGE_MAP: Record<
  string,
  { label: string; className: string; icon: string }
> = {
  pending: {
    label: 'รอตรวจสอบ',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: 'fa-hourglass-start',
  },
  investigating: {
    label: 'กำลังดำเนินการ',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: 'fa-spinner',
  },
  resolved: {
    label: 'ตอบกลับแล้ว / เสร็จสิ้น',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: 'fa-circle-check',
  },
  rejected: {
    label: 'ยุติเรื่อง',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: 'fa-circle-xmark',
  },
  dismissed: {
    label: 'ยุติเรื่อง',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: 'fa-circle-xmark',
  },
};

export default function ComplaintsClient({
  siteName,
  recentComplaints,
  initialTab = 'submit',
  initialTicket = '',
}: ComplaintsClientProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>(initialTab);

  // Submit form state
  const [type, setType] = useState<'corruption' | 'misconduct'>('corruption');
  const [title, setTitle] = useState('');
  const [accusedName, setAccusedName] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [pdpaConsent, setPdpaConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState('');
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Track form state
  const [ticketQuery, setTicketQuery] = useState(initialTicket);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackResult, setTrackResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!pdpaConsent) {
      setSubmitError(
        'กรุณากดยอมรับเงื่อนไขการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อนส่งเรื่อง'
      );
      return;
    }

    if (!title.trim() || !description.trim()) {
      setSubmitError('กรุณากรอกหัวข้อเรื่องและรายละเอียดพฤติการณ์ให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (accusedName.trim()) formData.append('accused_name', accusedName.trim());
      if (incidentDate) formData.append('incident_date', incidentDate);
      if (reporterName.trim())
        formData.append('reporter_name', reporterName.trim());
      if (reporterPhone.trim())
        formData.append('reporter_phone', reporterPhone.trim());
      if (reporterEmail.trim())
        formData.append('reporter_email', reporterEmail.trim());
      if (attachment) formData.append('attachment', attachment);

      const res = await fetch('/api/complaints/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      } else {
        setGeneratedTicket(data.ticket_number);
        setTitle('');
        setAccusedName('');
        setIncidentDate('');
        setDescription('');
        setReporterName('');
        setReporterPhone('');
        setReporterEmail('');
        setAttachment(null);
      }
    } catch {
      setSubmitError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = async (
    e?: React.FormEvent,
    overrideTicket?: string
  ) => {
    if (e) e.preventDefault();
    const targetTicket = (overrideTicket ?? ticketQuery).trim();
    if (!targetTicket) return;

    setTrackingLoading(true);
    setTrackError('');
    setTrackResult(null);

    try {
      const res = await fetch(
        `/api/complaints/check?ticket=${encodeURIComponent(targetTicket)}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setTrackError(
          json.error ||
            `ไม่พบข้อมูลคำร้องหมายเลข "${targetTicket}" กรุณาตรวจสอบรหัสอีกครั้ง`
        );
      } else {
        setTrackResult(json.data);
      }
    } catch {
      setTrackError('เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-12 -mt-0 sm:-mt-8 relative z-20">
      {/* Navigation Tabs */}
      <div className="mx-4 sm:mx-0 my-4 sm:my-0 bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-none sm:shadow-xl sm:shadow-slate-200/50 border border-slate-200 sm:border-slate-100 mb-4 sm:mb-8 flex gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl text-center font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'submit'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-paper-plane"></i> แจ้งเรื่องร้องเรียน / ร้องทุกข์
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('track')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl text-center font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'track'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-comments"></i> ติดตามสถานะ / กระทู้ถาม-ตอบ
        </button>
      </div>

      {activeTab === 'submit' ? (
        generatedTicket ? (
          <div className="bg-white rounded-none sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-none sm:shadow-xl border-0 sm:border border-emerald-100 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-6 shadow-inner">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">
              ส่งเรื่องร้องเรียนสำเร็จ!
            </h2>
            <p className="text-slate-500 text-sm mb-6 sm:mb-8">
              ระบบได้รับข้อมูลของท่านเรียบร้อยแล้ว และจะส่งต่อให้ผู้บริหารเพื่อตรวจสอบโดยเร็วที่สุด
            </p>

            <div className="bg-slate-50 border-2 border-dashed border-orange-200 rounded-2xl p-4 sm:p-6 max-w-md mx-auto mb-6 sm:mb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                รหัสติดตามเรื่องร้องเรียน (Ticket Number)
              </p>
              <div className="text-xl sm:text-2xl md:text-3xl font-mono font-extrabold text-orange-600 tracking-wider select-all">
                {generatedTicket}
              </div>
              <p className="text-xs text-rose-500 mt-2 sm:mt-3 font-medium">
                <i className="fa-solid fa-triangle-exclamation mr-1"></i>{' '}
                กรุณาจดจำหรือถ่ายภาพรหัสนี้ไว้ เพื่อใช้ตรวจสอบความคืบหน้า
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedTicket);
                  setCopiedTicket(true);
                  setTimeout(() => setCopiedTicket(false), 2000);
                }}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <i
                  className={`fa-regular ${
                    copiedTicket ? 'fa-circle-check text-emerald-600' : 'fa-copy'
                  }`}
                ></i>{' '}
                {copiedTicket ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = generatedTicket;
                  setGeneratedTicket('');
                  setTicketQuery(t);
                  setActiveTab('track');
                  handleTrackSearch(undefined, t);
                }}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-orange-600/20 flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-magnifying-glass"></i>{' '}
                ไปหน้าตรวจสอบสถานะ
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-xl sm:shadow-slate-200/40 border-0 sm:border border-slate-100 overflow-hidden">
            {/* PDPA & Security Notice Banner */}
            <div className="bg-orange-50/80 border-b border-orange-100 p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-sm">
                <i className="fa-solid fa-user-lock"></i>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <h3 className="font-bold text-orange-950 text-sm mb-1">
                  มาตรการคุ้มครองผู้แจ้งเบาะแสและข้อมูลส่วนบุคคล (PDPA)
                </h3>
                <p>
                  ข้อมูลของท่านจะถูกเก็บรักษาเป็นความลับสูงสุดตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
                  พ.ศ. 2562 โดยท่านสามารถเลือกที่จะ{' '}
                  <strong>&quot;ไม่ระบุตัวตน&quot;</strong> ได้
                  อย่างไรก็ตามการระบุช่องทางติดต่อจะช่วยให้เจ้าหน้าที่สามารถสอบถามข้อเท็จจริงเพิ่มเติมได้รวดเร็วขึ้น
                </p>
              </div>
            </div>

            {submitError && (
              <div className="m-4 sm:m-6 mb-0 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation text-lg"></i>
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
              {/* Section 1: Complaint Details */}
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">
                    1
                  </span>
                  ข้อมูลเรื่องร้องเรียน <span className="text-rose-500">*</span>
                </h3>

                <div className="space-y-5">
                  {/* Type Radio */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      ประเภทเรื่องร้องเรียน <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="corruption"
                          checked={type === 'corruption'}
                          onChange={() => setType('corruption')}
                          className="peer sr-only"
                        />
                        <div className="p-4 rounded-xl border-2 border-slate-200 peer-checked:border-rose-500 peer-checked:bg-rose-50/50 hover:bg-slate-50 transition-all flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-lg shrink-0">
                            <i className="fa-solid fa-hand-holding-dollar"></i>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">
                              แจ้งเบาะแสการทุจริต
                            </div>
                            <div className="text-[11px] text-slate-500">
                              การเรียกรับผลประโยชน์, จัดซื้อจัดจ้างไม่โปร่งใส
                            </div>
                          </div>
                        </div>
                      </label>
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="misconduct"
                          checked={type === 'misconduct'}
                          onChange={() => setType('misconduct')}
                          className="peer sr-only"
                        />
                        <div className="p-4 rounded-xl border-2 border-slate-200 peer-checked:border-orange-600 peer-checked:bg-orange-50/50 hover:bg-slate-50 transition-all flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-lg shrink-0">
                            <i className="fa-solid fa-scale-unbalanced"></i>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">
                              ร้องเรียนทั่วไป / ประพฤติมิชอบ
                            </div>
                            <div className="text-[11px] text-slate-500">
                              การให้บริการ, พฤติกรรมไม่เหมาะสม, ข้อเสนอแนะ
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      หัวข้อเรื่องร้องเรียน <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ระบุประเด็นสำคัญโดยย่อ..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        ชื่อบุคคล / หน่วยงานที่ถูกร้องเรียน (ถ้ามี)
                      </label>
                      <input
                        type="text"
                        value={accusedName}
                        onChange={(e) => setAccusedName(e.target.value)}
                        placeholder="ระบุชื่อ หรือ ฝ่ายงาน..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        วันที่เกิดเหตุการณ์ (โดยประมาณ)
                      </label>
                      <input
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      รายละเอียดพฤติการณ์ / ข้อเท็จจริง{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="อธิบายรายละเอียดเหตุการณ์ สถานที่ หรือพฤติการณ์ที่ชัดเจน เพื่อประโยชน์ในการตรวจสอบข้อเท็จจริง..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    ></textarea>
                  </div>

                  {/* Attachment */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      แนบไฟล์หลักฐานประกอบ (ถ้ามี)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip"
                      onChange={(e) =>
                        setAttachment(e.target.files?.[0] || null)
                      }
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 border border-slate-200 rounded-xl p-1.5 bg-slate-50"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      รองรับไฟล์ PDF, รูปภาพ (JPG, PNG), Word หรือ ZIP ขนาดไม่เกิน
                      10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Reporter Info */}
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-1 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center">
                    2
                  </span>
                  ข้อมูลผู้แจ้งเบาะแส{' '}
                  <span className="text-xs font-normal text-slate-400">
                    (เว้นว่างได้หากต้องการปกปิดตัวตน)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  ข้อมูลส่วนนี้จะถูกเก็บเป็นความลับ และเข้าถึงได้เฉพาะผู้บริหารระดับสูงเท่านั้น
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      ชื่อ - นามสกุล
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="ไม่ระบุได้..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      เบอร์โทรศัพท์ติดต่อกลับ
                    </label>
                    <input
                      type="text"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      placeholder="08X-XXX-XXXX"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      อีเมล (Email)
                    </label>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* PDPA Consent Checkbox */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdpaConsent}
                    onChange={(e) => setPdpaConsent(e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    ข้าพเจ้ายืนยันว่าข้อมูลที่แจ้งข้างต้นเป็นความจริงทุกประการ และยินยอมให้{' '}
                    <strong>{siteName}</strong> เก็บรวบรวม ใช้
                    หรือประมวลผลข้อมูลส่วนบุคคลและหลักฐานที่แนบมานี้
                    เพื่อวัตถุประสงค์ในการตรวจสอบข้อเท็จจริงตามขั้นตอนทางราชการเท่านั้น{' '}
                    <span className="text-rose-500 font-bold">*</span>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-60 text-white font-extrabold text-base shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-paper-plane"></i>{' '}
                  {submitting
                    ? 'กำลังบันทึกข้อมูล...'
                    : 'ส่งเรื่องร้องเรียนถึงผู้บริหาร'}
                </button>
              </div>
            </form>
          </div>
        )
      ) : (
        /* TAB 2: TRACK STATUS & PUBLIC FORUM */
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-none sm:shadow-xl sm:shadow-slate-200/40 border-0 sm:border border-slate-100">
            <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                <i className="fa-solid fa-ticket"></i>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
                ตรวจสอบสถานะด้วยรหัส Ticket
              </h2>
              <p className="text-slate-500 text-sm">
                กรอกรหัสติดตามเรื่องร้องเรียน (Ticket Number) เช่น{' '}
                <code className="text-orange-600 font-bold">
                  CMP-20260405-XXXX
                </code>{' '}
                เพื่อดูรายละเอียดเฉพาะเจาะจง
              </p>
            </div>

            <form
              onSubmit={(e) => handleTrackSearch(e)}
              className="max-w-lg mx-auto mb-10"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={ticketQuery}
                  onChange={(e) => setTicketQuery(e.target.value)}
                  required
                  placeholder="ระบุรหัส CMP-XXXXXXXX-XXXX"
                  className="flex-1 px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm font-bold text-slate-800 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-center sm:text-left"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-8 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all shadow-lg shadow-orange-600/20 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-magnifying-glass"></i>{' '}
                  {trackingLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
                </button>
              </div>
            </form>

            {trackError && (
              <div className="max-w-lg mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold text-center flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-lg"></i>
                <span>{trackError}</span>
              </div>
            )}

            {trackResult && (
              <div className="max-w-2xl mx-auto bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-200/80">
                {(() => {
                  const st =
                    STATUS_MAP[trackResult.status] || STATUS_MAP.pending;
                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase">
                            รหัสอ้างอิง
                          </span>
                          <div className="text-xl font-mono font-extrabold text-orange-600">
                            {trackResult.ticket_number}
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 ${st.color}`}
                        >
                          <i className={`fa-solid ${st.icon}`}></i> {st.label}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div>
                          <span className="text-xs font-bold text-slate-400 block mb-1">
                            หัวข้อเรื่องร้องเรียน:
                          </span>
                          <p className="font-bold text-slate-800 text-base">
                            {trackResult.title}
                          </p>
                        </div>

                        {trackResult.status_note && (
                          <div className="mt-6 pt-6 border-t border-slate-200">
                            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                              <i className="fa-solid fa-comment-dots"></i>{' '}
                              บันทึกผลการตรวจสอบ / ชี้แจงจากผู้บริหาร:
                            </span>
                            <div className="p-4 rounded-xl bg-white border border-orange-100 text-slate-700 leading-relaxed whitespace-pre-line">
                              {trackResult.status_note}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Public Complaint Thread / Forum */}
          <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-none sm:shadow-xl sm:shadow-slate-200/40 border-0 sm:border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold mb-2">
                  <i className="fa-solid fa-bullhorn"></i> Public Complaint
                  Thread
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-800">
                  กระดานติดตามเรื่องร้องเรียนและการชี้แจงล่าสุด
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  แสดงรายการเรื่องร้องเรียนและผลการดำเนินการจากผู้บริหาร
                  (สงวนข้อมูลส่วนบุคคลของผู้แจ้งตามหลัก PDPA)
                </p>
              </div>
            </div>

            {recentComplaints.length > 0 ? (
              <div className="space-y-6">
                {recentComplaints.map((item) => {
                  const badge =
                    THREAD_BADGE_MAP[item.status || 'pending'] ||
                    THREAD_BADGE_MAP.pending;
                  const typeBadge =
                    item.type === 'corruption'
                      ? {
                          label: 'แจ้งเบาะแสทุจริต',
                          className: 'text-rose-600 bg-rose-50 border-rose-100',
                        }
                      : {
                          label: 'ร้องเรียนทั่วไป/ข้อเสนอแนะ',
                          className:
                            'text-orange-600 bg-orange-50 border-orange-100',
                        };

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/40 hover:border-orange-200 transition-all shadow-xs"
                    >
                      {/* Thread Header */}
                      <div className="bg-white px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            #{item.ticket_number}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${typeBadge.className}`}
                          >
                            {typeBadge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">
                            <i className="fa-regular fa-clock mr-1"></i>
                            {item.created_at_formatted}
                          </span>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${badge.className}`}
                          >
                            <i
                              className={`fa-solid ${badge.icon} text-[10px]`}
                            ></i>{' '}
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* Question / Complaint Body */}
                      <div className="p-5">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 font-bold text-sm">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-400 mb-1">
                              ผู้แจ้ง:{' '}
                              <span className="font-semibold text-slate-600">
                                {item.masked_reporter}
                              </span>
                            </div>
                            <h4 className="text-base font-extrabold text-slate-800 mb-2">
                              {item.title}
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Admin Response */}
                        {item.status_note ? (
                          <div className="mt-5 ml-4 sm:ml-12 pl-4 border-l-4 border-orange-500 bg-orange-50/60 rounded-r-2xl p-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">
                                <i className="fa-solid fa-check"></i>
                              </span>
                              <span className="text-xs font-extrabold text-orange-950">
                                คำชี้แจง / ผลการดำเนินการจากสถานศึกษา
                              </span>
                              <span className="text-[11px] text-orange-400 ml-auto">
                                {item.updated_at_formatted}
                              </span>
                            </div>
                            <div className="text-sm text-slate-700 leading-relaxed pl-8 whitespace-pre-line">
                              {item.status_note}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 ml-4 sm:ml-12 text-xs text-slate-400 italic flex items-center gap-1.5">
                            <i className="fa-regular fa-comment-dots"></i>{' '}
                            อยู่ระหว่างขั้นตอนการตรวจสอบและรอการตอบกลับจากเจ้าหน้าที่...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <i className="fa-regular fa-comments text-4xl text-slate-300 mb-3 block"></i>
                <p className="text-slate-500 font-bold text-sm">
                  ยังไม่มีรายการเรื่องร้องเรียนในระบบ
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
