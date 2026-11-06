import type { Lang } from "@/types/holiday";

// 받는 사람 기준의 역할: 상대방 공휴일 배려, 우리 쪽 휴무 안내, 양국 공통 공휴일
export type TemplateRole = 'PARTNER_HOLIDAY' | 'OUR_HOLIDAY' | 'BOTH_HOLIDAY';

interface Message {
    subject: string;
    body: string;
}

interface TemplateContent {
    title: string;
    mail: (date: string, holidayName: string) => Message;
    translation: (date: string, holidayName: string) => Message;
}

export interface TemplateDraft {
    title: string;
    subject: string;
    body: string;
    translationSubject: string;
    translationBody: string;
}

// 한국어 화면은 일본 파트너사에, 일본어 화면은 한국 파트너사에 보내므로 쉬는 나라에 따라 역할이 달라짐
export function templateRole(lang: Lang, holidayType: 'kr' | 'jp' | 'both'): TemplateRole {
    if (holidayType === 'both') return 'BOTH_HOLIDAY';
    const partnerCountry = lang === 'ko' ? 'jp' : 'kr';
    return holidayType === partnerCountry ? 'PARTNER_HOLIDAY' : 'OUR_HOLIDAY';
}

// 메일은 받는 사람의 언어로, 번역은 화면 언어로 작성
const emailTemplates: Record<Lang, Record<TemplateRole, TemplateContent>> = {
  ko: {
    PARTNER_HOLIDAY: {
      title: "일본 공휴일 배려",
      mail: (date, holidayName) => ({
        subject: `【ご確認】${date} 日本の祝日（${holidayName}）に伴う業務日程の件`,
        body:
`いつも大変お世話になっております。

${date}は日本の祝日（${holidayName}）にあたると存じております。
祝日前後はご対応が難しいかと存じますので、お急ぎの案件は祝日前までに進め、その他の案件は祝日明けにご確認いただければ幸いです。

引き続き、よろしくお願い申し上げます。`
      }),
      translation: (date, holidayName) => ({
        subject: `[확인] ${date} 일본 공휴일(${holidayName})에 따른 업무 일정 건`,
        body:
`항상 신세를 지고 있습니다.

일본의 공휴일(${holidayName})인 ${date}에는 대응이 어려우실 것으로 알고 있습니다.
급한 건은 공휴일 전까지 진행하고, 나머지는 공휴일이 지난 뒤에 확인해 주시면 감사하겠습니다.

앞으로도 잘 부탁드립니다.`
      })
    },
    OUR_HOLIDAY: {
      title: "한국 공휴일 휴무 안내",
      mail: (date, holidayName) => ({
        subject: `【お知らせ】${date} 韓国の祝日（${holidayName}）に伴う休業のご案内`,
        body:
`いつもお世話になっております。

誠に勝手ながら、韓国の祝日（${holidayName}）に伴い、下記の日程は弊社の業務を休止させていただきます。

■ 休業日：${date}

休業日にいただいたお問い合わせにつきましては、業務再開後に順次対応いたします。
ご不便をおかけいたしますが、何卒ご了承くださいますようお願い申し上げます。`
      }),
      translation: (date, holidayName) => ({
        subject: `[안내] ${date} 한국 공휴일(${holidayName})에 따른 휴무 안내`,
        body:
`항상 신세를 지고 있습니다.

송구하오나 한국의 공휴일(${holidayName})로 인해 아래 일정에는 저희 업무를 쉬게 되었습니다.

■ 휴무일: ${date}

휴무일에 주신 문의는 업무 재개 후 순차적으로 답변드리겠습니다.
불편을 드려 죄송하며, 너른 양해 부탁드립니다.`
      })
    },
    BOTH_HOLIDAY: {
      title: "양국 공통 공휴일 일정 조정",
      mail: (date) => ({
        subject: `【ご連絡】${date} 日韓共通の祝日に伴う日程調整のお願い`,
        body:
`いつも大変お世話になっております。

${date}は日本と韓国の両国で祝日となり、貴社・弊社ともに休業となります。
進行中のプロジェクトに支障が出ないよう、事前に日程を調整させていただければと存じます。

ご相談事項がございましたら、お気軽にお知らせください。
今後とも、よろしくお願い申し上げます。`
      }),
      translation: (date) => ({
        subject: `[연락] ${date} 한일 공통 공휴일에 따른 일정 조정 요청`,
        body:
`항상 신세를 지고 있습니다.

${date}에는 한국과 일본 모두 공휴일이라 귀사와 저희 모두 휴무입니다.
진행 중인 프로젝트에 차질이 없도록 미리 일정을 조정하고자 합니다.

상의하실 내용이 있으면 편하게 알려 주십시오.
앞으로도 잘 부탁드립니다.`
      })
    }
  },
  ja: {
    PARTNER_HOLIDAY: {
      title: "韓国の祝日への配慮",
      mail: (date, holidayName) => ({
        subject: `[확인] ${date} 한국 공휴일(${holidayName})에 따른 업무 일정 건`,
        body:
`항상 신세를 지고 있습니다.

한국의 공휴일(${holidayName})인 ${date}에는 대응이 어려우실 것으로 알고 있습니다.
급한 건은 공휴일 전까지 진행하고, 나머지는 공휴일이 지난 뒤에 확인해 주시면 감사하겠습니다.

앞으로도 잘 부탁드립니다.`
      }),
      translation: (date, holidayName) => ({
        subject: `【ご確認】${date} 韓国の祝日（${holidayName}）に伴う業務日程の件`,
        body:
`いつも大変お世話になっております。

${date}は韓国の祝日（${holidayName}）にあたると存じております。
お急ぎの案件は祝日前までに進め、その他の案件は祝日明けにご確認いただければ幸いです。

引き続き、よろしくお願い申し上げます。`
      })
    },
    OUR_HOLIDAY: {
      title: "日本の祝日による休業のご案内",
      mail: (date, holidayName) => ({
        subject: `[안내] ${date} 일본 공휴일(${holidayName})에 따른 휴무 안내`,
        body:
`항상 신세를 지고 있습니다.

송구하오나 일본의 공휴일(${holidayName})로 인해 아래 일정에는 저희 업무를 쉬게 되었습니다.

■ 휴무일: ${date}

휴무일에 주신 문의는 업무 재개 후 순차적으로 답변드리겠습니다.
불편을 드려 죄송하며, 너른 양해 부탁드립니다.`
      }),
      translation: (date, holidayName) => ({
        subject: `【お知らせ】${date} 日本の祝日（${holidayName}）に伴う休業のご案内`,
        body:
`いつもお世話になっております。

誠に勝手ながら、日本の祝日（${holidayName}）に伴い、下記の日程は弊社の業務を休止させていただきます。

■ 休業日：${date}

休業日にいただいたお問い合わせにつきましては、業務再開後に順次対応いたします。
ご不便をおかけいたしますが、何卒ご了承くださいますようお願い申し上げます。`
      })
    },
    BOTH_HOLIDAY: {
      title: "両国共通の祝日による日程調整",
      mail: (date) => ({
        subject: `[연락] ${date} 한일 공통 공휴일에 따른 일정 조정 요청`,
        body:
`항상 신세를 지고 있습니다.

${date}에는 한국과 일본 모두 공휴일이라 귀사와 저희 모두 휴무입니다.
진행 중인 프로젝트에 차질이 없도록 미리 일정을 조정하고자 합니다.

상의하실 내용이 있으면 편하게 알려 주십시오.
앞으로도 잘 부탁드립니다.`
      }),
      translation: (date) => ({
        subject: `【ご連絡】${date} 日韓共通の祝日に伴う日程調整のお願い`,
        body:
`いつも大変お世話になっております。

${date}は日本と韓国の両国で祝日となり、貴社・弊社ともに休業となります。
進行中のプロジェクトに支障が出ないよう、事前に日程を調整させていただければと存じます。

ご相談事項がございましたら、お気軽にお知らせください。
今後とも、よろしくお願い申し上げます。`
      })
    }
  }
};

export function buildTemplateDraft(lang: Lang, role: TemplateRole, date: string, holidayName: string): TemplateDraft {
    const template = emailTemplates[lang][role];
    const mail = template.mail(date, holidayName);
    const translation = template.translation(date, holidayName);
    return {
        title: template.title,
        subject: mail.subject,
        body: mail.body,
        translationSubject: translation.subject,
        translationBody: translation.body,
    };
}
