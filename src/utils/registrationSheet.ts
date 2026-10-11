import { Member } from '../types';
import { MOROCCAN_REGIONS } from '../data/regions';
import { DOC_KINDS, DOC_LABELS, docStatusOf, dossierProgress } from './dossier';

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Ouvre la fiche d'adhésion dans une fenêtre autonome et lance l'impression
 * (le navigateur permet aussi « Enregistrer au format PDF »).
 */
export function printRegistrationSheet(member: Member): void {
  const region = MOROCCAN_REGIONS.find((r) => r.id === member.regionId);
  const origin = window.location.origin;
  const rows: Array<[string, string, string]> = [
    ['Nom / Prénom', 'الاسم الكامل', `${member.lastNameFr.toUpperCase()} ${member.firstNameFr}`],
    ['Nom / Prénom (arabe)', 'الاسم بالعربية', `${member.lastNameAr} ${member.firstNameAr}`],
    ['N° CIN', 'رقم البطاقة الوطنية', member.cin],
    ['Date de naissance', 'تاريخ الازدياد', member.birthDate],
    ['Sexe', 'الجنس', member.gender === 'F' ? 'Féminin / أنثى' : 'Masculin / ذكر'],
    ['Région', 'الجهة', region ? `${region.nameFr} / ${region.nameAr}` : member.regionId],
    ['Province / Préfecture', 'العمالة / الإقليم', member.province],
    ['Commune', 'الجماعة', member.commune],
    ['Email', 'البريد الإلكتروني', member.email],
    ['Téléphone', 'الهاتف', member.phone],
    ['Profession', 'المهنة', member.profession],
    ['Commission souhaitée', 'اللجنة المرغوب فيها', member.commissionInterest],
    [
      'Dossier d’adhésion (pièces validées)',
      'ملف الانخراط (الوثائق المصادق عليها)',
      `${dossierProgress(member)}/${DOC_KINDS.length} — ${DOC_KINDS.filter((k) => docStatusOf(member, k) !== 'verified')
        .map((k) => DOC_LABELS[k].fr)
        .join(', ') || 'complet'}`,
    ],
  ];

  // Liste des pièces à joindre : cette fiche accompagne le dossier papier remis au coordinateur régional.
  const checklist = DOC_KINDS.map((k) => {
    const done = docStatusOf(member, k) === 'verified';
    return `<li><span class="box">${done ? '&#10003;' : ''}</span> ${esc(DOC_LABELS[k].fr)} <span class="ar">${esc(DOC_LABELS[k].ar)}</span></li>`;
  }).join('');

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Fiche d'adhésion ${esc(member.membershipNumber)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Tahoma, Arial, sans-serif; color: #0f172a; margin: 0; font-size: 12px; }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #0e6a8c; padding-bottom: 10px; }
  header img.logo { width: 110px; height: auto; background: #fff; }
  header h1 { margin: 0; font-size: 18px; color: #0e6a8c; }
  header p { margin: 2px 0 0; color: #475569; }
  .title { text-align: center; margin: 16px 0 10px; font-size: 16px; font-weight: bold; }
  .num { text-align: center; font-family: monospace; font-size: 14px; margin-bottom: 14px; }
  .layout { display: flex; gap: 16px; align-items: flex-start; }
  .photo { width: 110px; height: 135px; object-fit: cover; border: 1px solid #94a3b8; }
  table { border-collapse: collapse; flex: 1; width: 100%; }
  td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
  td.l { width: 38%; background: #f1f5f9; font-weight: bold; }
  td.l span { display: block; direction: rtl; font-weight: normal; color: #475569; }
  .sign { display: flex; justify-content: space-between; margin-top: 36px; }
  .sign div { width: 45%; border-top: 1px solid #0f172a; padding-top: 6px; text-align: center; }
  .checks { margin: 22px 0 0; padding: 12px 14px; border: 1px dashed #64748b; border-radius: 6px; }
  .checks h3 { margin: 0 0 8px; font-size: 13px; }
  .checks ul { list-style: none; margin: 0; padding: 0; }
  .checks li { margin: 5px 0; display: flex; align-items: center; gap: 8px; }
  .checks .ar { color: #475569; margin-inline-start: auto; direction: rtl; }
  .box { width: 14px; height: 14px; border: 1.5px solid #0f172a; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }
  .note { margin-top: 26px; font-size: 10px; color: #475569; line-height: 1.5; }
</style></head><body>
<header>
  <img class="logo" src="${origin}/logo.png" alt="Logo PME">
  <div>
    <h1>Le Parti du Maroc Émergeant — حزب المغرب الصاعد</h1>
    <p>Royaume du Maroc / المملكة المغربية</p>
  </div>
</header>
<div class="title">FICHE RÉCAPITULATIVE D'ADHÉSION — بطاقة تلخيص طلب الانخراط</div>
<div class="num">N° ${esc(member.membershipNumber)} &nbsp;•&nbsp; ${esc(member.joinedDate)}</div>
<div class="layout">
  <img class="photo" src="${esc(member.photoUrl)}" alt="Photo">
  <table>
    ${rows
      .map(([fr, ar, v]) => `<tr><td class="l">${esc(fr)}<span>${esc(ar)}</span></td><td>${esc(v)}</td></tr>`)
      .join('')}
  </table>
</div>
<div class="checks">
  <h3>Pièces à remettre à votre coordinateur régional / الوثائق الواجب تسليمها لمنسق جهتكم</h3>
  <ul>${checklist}</ul>
</div>
<div class="sign">
  <div>Signature de l'adhérent<br>إمضاء المنخرط</div>
  <div>Cachet de la coordination régionale<br>خاتم التنسيقية الجهوية</div>
</div>
<p class="note">
  Les données de cette fiche sont destinées exclusivement à la gestion des adhésions du parti
  (loi n° 09-08 relative à la protection des données personnelles). L'adhérent dispose d'un droit
  d'accès, de rectification et d'opposition. / البيانات الواردة في هذه البطاقة مخصصة حصراً لتدبير الانخراطات
  وفق القانون 09-08.
</p>
<script>
  window.addEventListener('load', function () {
    var imgs = Array.prototype.slice.call(document.images);
    Promise.all(imgs.map(function (i) {
      return i.complete ? Promise.resolve() : new Promise(function (r) { i.onload = i.onerror = r; });
    })).then(function () { setTimeout(function () { window.print(); }, 200); });
  });
</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) {
    alert('Autorisez les fenêtres pop-up pour imprimer la fiche. / اسمح بالنوافذ المنبثقة لطباعة البطاقة.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
