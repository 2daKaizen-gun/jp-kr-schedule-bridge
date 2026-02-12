export type TemplateType = 'JP_HOLIDAY' | 'KR_HOLIDAY' | 'BOTH_HOLIDAY';

interface TemplateContent {
    title: string;
    subject: (date: string, holidayName: string) => string;
    body: (date: string, holidayName: string) => string;
}

// 언어별로 템플릿을 분리하여 관리
export const emailTemplates: Record<'ko' | 'ja', Record<TemplateType, TemplateContent>> = {
  ko: {
    JP_HOLIDAY: {
      title: "일본 공휴일 배려 (JP Holiday)",
      subject: (date, holidayName) => `【ご確認】${date} 日本の祝日（${holidayName}）에 따른 업무 일정 확인의 건`,
      body: (date, holidayName) => 
`いつも大変お世話になっております. (항상 신세를 지고 있습니다.)

${date}일은 일본의 공휴일인 [${holidayName}]으로 알고 있습니다. 
귀사의 연휴 기간 동안은 업무 대응이 어려우실 것으로 생각되어, 급한 건은 연휴 전까지 마무리하고 나머지는 연휴 이후에 확인해 주셔도 괜찮습니다.

즐거운 연휴 보내시길 바라며, 항상 협력해 주셔서 감사합니다.

何卒、よろしくお願い申し上げます. (아무쪼록 잘 부탁드립니다.)`
    },
    KR_HOLIDAY: {
      title: "한국 공휴일 알림 (KR Holiday)",
      subject: (date, holidayName) => `【お知らせ】韓国の祝日（${holidayName}）에 따른 휴무 안내의 건`,
      body: (date, holidayName) => 
`いつもお世話になっております. (언제나 신세를 지고 있습니다.)

誠に勝手ながら(무례를 무릅쓰고), 한국의 공휴일인 [${holidayName}]로 인해 다음과 같이 저희 쪽 업무가 중단됨을 안내드립니다.

■ 휴무 일자: ${date}
해당 기간 접수된 문의는 업무 복귀 후 순차적으로 답변 드리겠습니다. 

너른 양해 부탁드리며, 업무에 참고해 주시기 바랍니다.

引き続き、よろしくお願いいたします. (앞으로도 잘 부탁드립니다.)`
    },
    BOTH_HOLIDAY: {
      title: "양국 공휴일 공통 (Joint Holiday)",
      subject: (date, holidayName) => `【ご連絡】${date} 韓日 공통 공휴일로 인한 일정 조정 안내`,
      body: (date, holidayName) => 
`いつも大変お世話になっております. (항상 신세를 지고 있습니다.)

오는 ${date}일은 한국과 일본 모두 공휴일인 날입니다. 
양사 모두 휴무인 관계로, 진행 중인 프로젝트 일정에 차질이 없도록 사전에 일정을 조율하고자 합니다.

추가적인 논의가 필요하시면 말씀 부탁드리며, 편안한 연휴 되시길 바랍니다.

今後ともよろしくお願い申し上げます. (앞으로도 잘 부탁드립니다.)`
    }
  },
  ja: {
    JP_HOLIDAY: {
      title: "日本の祝日への配慮 (JP Holiday)",
      subject: (date, holidayName) => `【ご確認】${date} 日本の祝日（${holidayName}）に伴う進行スケジュール調整の件`,
      body: (date, holidayName) => 
`いつも大変お世話になっております.

${date}は日本の祝日（${holidayName}）にあたると存じております.
連休期間中は業務へのご対応が難しいかと存じますので, 急ぎの案件は連휴前までに進め, その他は連休明けにご確認いただければ幸いです.

充実した連休をお過ごしください. いつも多大なるご協力をいただき, 誠にありがとうございます.

何卒、よろしくお願い申し上げます.`
    },
    KR_HOLIDAY: {
      title: "韓国の祝日による休業 (KR Holiday)",
      subject: (date, holidayName) => `【お知らせ】韓国の祝日（${holidayName}）に伴う休業のご案内`,
      body: (date, holidayName) => 
`いつもお世話になっております.

誠に勝手ながら, 韓国の祝日である [${holidayName}] に伴い, 下記の通り弊社の業務を一時休止させていただきます.

■ 休業日: ${date}
休業期間中にいただいたお問い合わせにつきましては, 業務再開後, 順次対応させていただきます.

ご不便をおかけいたしますが, 何卒ご了承くださいますようお願い申し上げます.

引き続き、よろしくお願いいたします.`
    },
    BOTH_HOLIDAY: {
      title: "両国共通の祝日による調整 (Joint Holiday)",
      subject: (date, holidayName) => `【ご連絡】${date} 韓日共通の祝日に伴う日程調整のお願い`,
      body: (date, holidayName) => 
`いつも大変お世話になっております.

来る ${date} は韓国と日本の両国において祝日となります.
貴社・弊社ともに休業となりますため, 進行中のプロジェクトに支障が出ないよう, 事前にスケジュールを調整させていただきたく存じます.

追加のご相談がございましたら、いつでもお申し付けください. 穏やかな休日をお過ごしください.

今後ともよろしくお願い申し上げます.`
    }
  }
};