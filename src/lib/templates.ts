export type TemplateType = 'JP_HOLIDAY' | 'KR_HOLIDAY' | 'BOTH_HOLIDAY';

interface TemplateContent {
    title: string;
    subject: (date: string, holidayName: string) => string;
    body: (date: string, holidayName: string) => string;
}

export const emailTemplates: Record<TemplateType, TemplateContent> = {
  // 1. 일본이 공휴일일 때 (일본 파트너에게 "쉬는 거 아니까 천천히 해줘"라고 보낼 때)
  JP_HOLIDAY: {
    title: "일본 공휴일 배려 (JP Holiday)",
    subject: (date, holidayName) => 
      `【ご確認】${date} 日本の祝日（${holidayName}）に伴う 업무 일정 확인의 건`,
    body: (date, holidayName) => 
`いつも大変お世話になっております. (언제나 신세를 지고 있습니다.)

${date}은 일본의 공휴일인 [${holidayName}]으로 알고 있습니다. 
연휴 기간 동안은 업무 대응이 어려우실 것으로 생각되어, 급한 건은 연휴 전까지 마무리하고 나머지는 연휴 이후에 확인해주셔도 괜찮습니다.

즐거운 연휴 보내시길 바라며, 항상 협력해주셔서 감사합니다.

何卒、よろしくお願い申し上げます. (아무쪼록 잘 부탁드립니다.)`
  },

  // 2. 한국이 공휴일일 때 (일본 파트너에게 "우리 쉬니까 답장 늦을 거야"라고 알릴 때)
  KR_HOLIDAY: {
    title: "한국 공휴일 알림 (KR Holiday)",
    subject: (date, holidayName) => 
      `【お知らせ】韓国の祝일（${holidayName}）に伴う 휴무 안내의 건`,
    body: (date, holidayName) => 
`いつもお世話になっております. (언제나 신세를 지고 있습니다.)

誠に勝手ながら(무례를 무릅쓰고), 한국의 공휴일인 [${holidayName}]로 인해 다음과 같이 저희 쪽 업무가 중단됨을 안내드립니다.

■ 휴무 일자: ${date}
해당 기간 접수된 문의는 업무 복귀 후 순차적으로 답변 드리겠습니다. 

너른 양해 부탁드리며, 업무에 참고해주시기 바랍니다.

引き続き、よろしくお願いいたします. (앞으로도 잘 부탁드립니다.)`
  },

  // 3. 양국 모두 공휴일일 때 (서로 "우리 다 쉬니까 푹 쉬고 나중에 보자"라고 할 때)
  BOTH_HOLIDAY: {
    title: "양국 공휴일 공통 (Joint Holiday)",
    subject: (date, holidayName) => 
      `【ご連絡】${date} 韓日 공통 공휴일로 인한 일정 조정 안내`,
    body: (date, holidayName) => 
`いつも大変お世話になっております. (언제나 신세를 지고 있습니다.)

오는 ${date}은 한국과 일본 모두 공휴일인 날입니다. 
양사 모두 휴무인 관계로, 진행 중인 프로젝트 일정에 차질이 없도록 사전에 일정을 조율하고자 합니다.

추가적인 논의가 필요하시면 말씀 부탁드리며, 편안한 연휴 되시길 바랍니다.

今後ともよろしくお願い申し上げます. (앞으로도 잘 부탁드립니다.)`
  }
};