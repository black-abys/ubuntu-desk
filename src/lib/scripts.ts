import type { Lang } from "./types";

/**
 * Static demo copy for all 11 official languages.
 * English, isiZulu, and Sesotho strings are the existing reviewed demo scripts.
 * The other eight are machine translations and still need native-speaker review.
 * Currency, account ids, and by-law refs are interpolated unchanged.
 */

export const SAMPLES: Record<Lang, string> = {
  en: "Hi, why is my electricity bill R3,107 this month? I normally pay about R1,200.",
  zu: "Sawubona, kungani ibhili yami kagesi ingu-R3,107 kulenyanga? Imvamisa ngikhokha cishe u-R1,200.",
  st: "Dumela, hobaneng bili ya ka ya motlakase e le R3,107 kgweding ena? Hangata ke lefa R1,200 feela.",
  af: "Hallo, hoekom is my elektrisiteitsrekening R3,107 hierdie maand? Ek betaal gewoonlik omtrent R1,200.",
  nr: "Lotjhani, kubayini ibhilidi yami yombane ingu-R3,107 kile nyanga? Ngivamise ukubhadala cishe u-R1,200.",
  xh: "Molo, kutheni ibhili yam yombane ingu-R3,107 kule nyanga? Ndihlala ndihlawula malunga ne-R1,200.",
  nso: "Thobela, ke ka baka lang bili ya ka ya motlakase e le R3,107 kgweding ye? Ke tlwaetše go lefa gona ka R1,200.",
  tn: "Dumela, ke ka ntlha yang bili ya me ya motlakase e le R3,107 kgweding eno? Ke tlwaetse go duela gongwe R1,200.",
  ss: "Sawubona, kungani libhili lami ligesi lingu-R3,107 kulenyanga? Ngivamise kubhadala cishe i-R1,200.",
  ve: "Ndaa, ndi ngani bili yanga ya mudagasi i R3,107 ṅwedzi uno? Ndi tou renga nga ha R1,200.",
  ts: "Avuxeni, hikwalaho ka yini bili ya mina ya gezi yi R3,107 n’hweti leyi? Ndzi tolovele ku hakela kwalomu ka R1,200.",
};

/** A greeting that must not itself be treated as a billing question. */
export const GREETINGS: Record<Lang, string> = {
  en: "hello",
  zu: "Sawubona",
  st: "Dumela",
  af: "Hallo",
  nr: "Lotjhani",
  xh: "Molo",
  nso: "Thobela",
  tn: "Dumelang",
  ss: "Sawubona",
  ve: "Ndaa",
  ts: "Avuxeni",
};

const finding: Record<Lang, (amount: string) => string> = {
  en: (amount) =>
    `Hi! Simulated records show a potential billing error: the September reading was estimated and is above the 20% cap in the by-law. The difference on this demo account is ${amount}. This is not confirmed until municipal records agree. Confirm below if you want a dispute submitted.`,
  zu: (amount) =>
    `Sawubona! Ngibona iphutha elingaba khona: ukufundwa kukaSeptemba bekuqagelwa futhi kudlula umkhawulo ka-20%. Umehluko kule demo ngu-${amount}. Lokhu akuqinisekisiwe — qinisekisa ngezansi ukuze uthumele isikhalazo.`,
  st: (amount) =>
    `Dumela! Ke bona phoso e ka bang teng: palo ya Loetse e ne e hakanngwa mme e feta moedi wa 20%. Phapang demo ena ke ${amount}. Ha e so netefatsoe — netefatsa ka tlase pele o romela tletlebo.`,
  af: (amount) =>
    `Hallo! Gesimuleerde rekords wys ’n moontlike faktuurfout: die September-lesing is beraam en is bo die 20%-perk in die verordening. Die verskil op hierdie demo-rekening is ${amount}. Dit is nie bevestig totdat munisipale rekords saamstem nie. Bevestig hieronder as jy ’n dispuut wil indien.`,
  nr: (amount) =>
    `Lotjhani! Ngibona iphoso elingaba khona: ukufundwa kukaSeptemba bekulinganisiwe futhi kudlula umkhawulo we-20%. Umehluko kile demo ngu-${amount}. Lokhu akuqinisekisiwe — qinisekisa ngezansi ukuze uthumele isikhalazo.`,
  xh: (amount) =>
    `Molo! Ndibona imposiso enokubakho: ukufundwa kukaSeptemba bekubalelwa kwaye kudlula umda we-20%. Umahluko kule demo ngu-${amount}. Ayikaqinisekiswa — qinisekisa ngezantsi ukuba ufuna ukufaka isikhalazo.`,
  nso: (amount) =>
    `Thobela! Ke bona phošo yeo e ka bago gona: palo ya Setemere e be e akantšwe gomme e feta moedi wa 20%. Phapano ya demo ye ke ${amount}. Ga e so netefatšwe — netefatša ka tlase pele o romela tletlebo.`,
  tn: (amount) =>
    `Dumela! Ke bona phoso e e ka nnang teng: palo ya Lwetse e ne e akantse mme e feta molelwane wa 20%. Pharologano ya demo eno ke ${amount}. Ga e ise e netefadiwe — netefatsa fa tlase pele o romela tletlebo.`,
  ss: (amount) =>
    `Sawubona! Ngibona iphutfo lelingaba khona: kufundza kwaSeptemba bekulinganiso futsi kudlula umkhawulo wa-20%. Umehluko kule demo ngu-${amount}. Loku akukaqinisekiswa — qinisekisa ngezansi kutsi utfumele sikhalo.`,
  ve: (amount) =>
    `Ndaa! Ndi khou vhona vhukhakhi vhune ha nga vha hone: u vhala ha Khubvumedzi ho hangwa nahone ho fhira mulayo wa 20%. Phambano kha hei demo ndi ${amount}. A i athu u khwaṱhisedzwa — khwaṱhisedzani afho fhasi u itela u rumela khanedzo.`,
  ts: (amount) =>
    `Avuxeni! Ndzi vona xihoxo lexi nga va kona: ku hlayiwa ka Ndzhati a ku ringanyetiwe naswona ku tlula mpimo wa 20%. Ku hambana eka demo leyi i ${amount}. A swi si tiyisisiwa — tiyisisa laha hansi loko u lava ku rhumeriwa xisolo.`,
};

const noError: Record<Lang, string> = {
  en: "Hi! On these simulated figures I do not see a potential billing error. Nothing has been submitted.",
  zu: "Sawubona! Kulezi zinhlamvu ezifanisiwe angiboni iphutha elingaba khona lokukhokha. Akukho okuthunyelwe.",
  st: "Dumela! Dipalong tseena tsa demo ha ke bone phoso e ka bang teng ya tefo. Ha ho letho le rometsweng.",
  af: "Hallo! Op hierdie gesimuleerde syfers sien ek nie ’n moontlike faktuurfout nie. Niks is ingedien nie.",
  nr: "Lotjhani! Kilezi zinhlamvu ezifanisiwe angiboni iphoso elingaba khona. Akukho okuthunyelwe.",
  xh: "Molo! Kwezi manani zifanisiweyo andiboni mposiso inokuba yeyokuhlawulwa. Akukho nto ithunyelweyo.",
  nso: "Thobela! Dipalong tše tša demo ga ke bone phošo yeo e ka bago ya tefo. Ga go seo se rometšwego.",
  tn: "Dumela! Mo dipalong tseno tsa demo ga ke bone phoso e e ka nnang ya tuelo. Ga go sepe se se rometsweng.",
  ss: "Sawubona! Kuletinhlamvu letifanisiwe angiboni liphutfo lelingaba khona. Kute lokuthunyelwe.",
  ve: "Ndaa! Kha nomboro idzi dza demo a thi vhoni vhukhakhi vhune ha nga vha ha mbadelo. A hu na tshithu tsho rumelwaho.",
  ts: "Avuxeni! Eka tinomboro leti ta demo a ndzi voni xihoxo lexi nga va xa muholo. A ku na nchumu lowu rhumeriweke.",
};

const draft: Record<Lang, (period: string) => string> = {
  en: (period) => `Estimated reading appears to exceed the 20% cap (§14.3) for ${period}`,
  zu: (period) => `Estimated reading appears to exceed the 20% cap (§14.3) for ${period}`,
  st: (period) => `Estimated reading appears to exceed the 20% cap (§14.3) for ${period}`,
  af: (period) => `Die beraamde lesing lyk of dit die 20%-perk (§14.3) vir ${period} oorskry`,
  nr: (period) => `Ukufundwa okuliganisiweko kubonakala kudlula umkhawulo we-20% (§14.3) we-${period}`,
  xh: (period) => `Ukufundwa okubalelweyo kubonakala kudlula umda we-20% (§14.3) we-${period}`,
  nso: (period) => `Palo yeo e akantšwego e bonagala e feta moedi wa 20% (§14.3) wa ${period}`,
  tn: (period) => `Palo e e akantsweng e lebega e feta molelwane wa 20% (§14.3) wa ${period}`,
  ss: (period) => `Kufundza lokulinganisiwe kubonakala kudlula umkhawulo wa-20% (§14.3) wa-${period}`,
  ve: (period) => `U vhala ho hangwaho hu vhonala hu tshi fhira mulayo wa 20% (§14.3) wa ${period}`,
  ts: (period) => `Ku hlayiwa loku ringanyetiweke ku vonaka ku tlula mpimo wa 20% (§14.3) wa ${period}`,
};

const help: Record<Lang, string> = {
  en: "Hi! I can help with municipal billing questions and account disputes, such as a high electricity bill, an estimated reading, or a charge that looks wrong. Tell me about the bill or the account.",
  zu: "Sawubona! Ngingakusiza ngemibuzo yamabhili kamasipala nangezikhalazo ze-akhawunti, njengebhili kagesi ephakeme noma ukufundwa okuqagelwe. Ngitshele ngebhili noma nge-akhawunti.",
  st: "Dumela! Nka o thusa ka dipotso tsa bili ya masepala le ditletlebo tsa akhaonto, jwalo ka bili e phahameng ya motlakase kapa palo e hakantsoeng. Mpolelle ka bili kapa ka akhaonto.",
  af: "Hallo! Ek kan help met munisipale rekeningvrae en rekeningsdispute, soos ’n hoë elektrisiteitsrekening, ’n beraamde lesing, of ’n heffing wat verkeerd lyk. Vertel my van die rekening.",
  nr: "Lotjhani! Ngingakusiza ngemibuzo yeebhilidi zikamasipala nangezikhalazo ze-akhawunti, njengebhilidi yombane ephakemeko noma ukufundwa okuliganisiweko. Ngitshele ngebhilidi noma nge-akhawunti.",
  xh: "Molo! Ndingakunceda ngemibuzo yeebhili zikamasipala nezikhalazo zeakhawunti, njengebhili yombane ephezulu okanye ukufundwa okubalelweyo. Ndixelele ngebhili okanye ngeakhawunti.",
  nso: "Thobela! Nka go thuša ka dipotšišo tša dibili tša masepala le ditletlebo tša akhaonto, bjalo ka bili ye e phagamego ya motlakase goba palo yeo e akantšwego. Mpotše ka bili goba ka akhaonto.",
  tn: "Dumela! Nka go thusa ka dipotso tsa dibili tsa masepala le ditletlebo tsa akhaonto, jaaka bili e e kwa godimo ya motlakase kgotsa palo e e akantsweng. Mpolelele ka bili kgotsa ka akhaonto.",
  ss: "Sawubona! Ngingakusita ngemibuto yemabhili emasipala netikhalo te-akhawunti, njengelibhili ligesi leliphakeme noma kufundza lokulinganisiwe. Ngitshele ngelibhili noma nge-akhawunti.",
  ve: "Ndaa! Ndi nga ni thusa nga mbudziso dza mabili a masipala na khanedzo dza akhaunthu, sa bili ya mudagasi yo nḓa nga nṱha kana u vhala ho hangwaho. Ndi vhudzeni nga bili kana nga akhaunthu.",
  ts: "Avuxeni! Ndzi nga ku pfuna hi swivutiso swa tibili ta masipala na swisolo swa akhawunti, tanihi bili ya gezi leyi yi tlakukeke kumbe ku hlayiwa loku ringanyetiweke. Ndzi byele hi bili kumbe hi akhawunti.",
};

const missing: Record<Lang, (accountNo: string, demoAccount: string) => string> = {
  en: (accountNo, demoAccount) =>
    `I could not find account ${accountNo} on the simulated records. Check the number. The demo account is ${demoAccount}. No billing finding was made.`,
  zu: (accountNo, demoAccount) =>
    `Angiyitholanga i-akhawunti ${accountNo} kumarekhodi ale demo. Hlola inombolo. I-akhawunti yedemo ngu-${demoAccount}. Akukho mphumela webhili.`,
  st: (accountNo, demoAccount) =>
    `Ha ke fumane akhaonto ${accountNo} direkotong tsa demo. Hlahloba nomoro. Akhaonto ya demo ke ${demoAccount}. Ha ho phumantsho ya bili.`,
  af: (accountNo, demoAccount) =>
    `Ek kon nie rekening ${accountNo} op die gesimuleerde rekords vind nie. Kontroleer die nommer. Die demo-rekening is ${demoAccount}. Geen faktuurbevinding is gemaak nie.`,
  nr: (accountNo, demoAccount) =>
    `Angiyitholanga i-akhawunti ${accountNo} kumarekhodi la demo. Hlola inombolo. I-akhawunti yedemo ngu-${demoAccount}. Akukho mphumela webhilidi.`,
  xh: (accountNo, demoAccount) =>
    `Andiyifumananga iakhawunti ${accountNo} kwiirekhodi ezifanisiweyo. Khangela inombolo. Iakhawunti yedemo ngu-${demoAccount}. Akukho siphumo sebhili.`,
  nso: (accountNo, demoAccount) =>
    `Ga ke a hwetša akhaonto ${accountNo} direkotong tša demo. Lekola nomoro. Akhaonto ya demo ke ${demoAccount}. Ga go na sephetho sa bili.`,
  tn: (accountNo, demoAccount) =>
    `Ga ke a bona akhaonto ${accountNo} mo direkotong tsa demo. Tlhola nomoro. Akhaonto ya demo ke ${demoAccount}. Ga go na diphitlhelelo tsa bili.`,
  ss: (accountNo, demoAccount) =>
    `Angilitfolanga i-akhawunti ${accountNo} kumarekhodi ale demo. Hlola inombolo. I-akhawunti yedemo ngu-${demoAccount}. Kute mphumela welibhili.`,
  ve: (accountNo, demoAccount) =>
    `A tho ngo wana akhaunthu ${accountNo} kha rekhodo dza demo. Lavhelesani nomboro. Akhaunthu ya demo ndi ${demoAccount}. A hu na mvelelo ya bili.`,
  ts: (accountNo, demoAccount) =>
    `A ndzi ku kumanga akhawunti ${accountNo} eka tirekhodi ta demo. Languta nomboro. Akhawunti ya demo i ${demoAccount}. A ku na vuyelo bya bili.`,
};

export function findingReply(lang: Lang, amount: string): string {
  return finding[lang](amount);
}

export function noErrorReply(lang: Lang): string {
  return noError[lang];
}

export function draftReason(lang: Lang, period: string): string {
  return draft[lang](period);
}

export function helpText(lang: Lang): string {
  return help[lang];
}

export function missingText(lang: Lang, accountNo: string, demoAccount: string): string {
  return missing[lang](accountNo, demoAccount);
}
