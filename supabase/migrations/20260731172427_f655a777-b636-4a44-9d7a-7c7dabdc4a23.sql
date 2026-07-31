
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  dek text,
  body text NOT NULL DEFAULT '',
  image_url text,
  category text NOT NULL DEFAULT 'local',
  edition_date date NOT NULL DEFAULT current_date,
  is_lead boolean NOT NULL DEFAULT false,
  is_breaking boolean NOT NULL DEFAULT false,
  sources text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are public" ON public.articles FOR SELECT TO anon, authenticated USING (published = true);

CREATE TABLE public.adverts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text,
  link_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.adverts TO anon, authenticated;
GRANT ALL ON public.adverts TO service_role;
ALTER TABLE public.adverts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active adverts are public" ON public.adverts FOR SELECT TO anon, authenticated USING (active = true);

CREATE TABLE public.statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.statuses TO anon, authenticated;
GRANT ALL ON public.statuses TO service_role;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active statuses are public" ON public.statuses FOR SELECT TO anon, authenticated USING (active = true);

INSERT INTO public.articles (slug, title, dek, body, category, edition_date, is_lead, is_breaking, sources) VALUES
('first-lady-storms-ile-ife-palace-empowers-1000-traders',
 'First Lady Storms Ile-Ife Palace, Empowers 1,000 Traders with ₦50m Cash',
 'Ooni hails Renewed Hope Initiative as timely boost for grassroots businesses',
 '<p>Sen. Oluremi Tinubu (through the Renewed Hope Initiative) disbursed ₦50,000 each to 1,000 petty traders. The event took place at Kensington Hall in the Ooni’s Palace, Ile-Ife.</p><p>The Ooni of Ife, Oba Adeyeye Enitan Ogunwusi, applauded the programme as timely and focused on uplifting the less privileged. Representatives (including APC figures linked to the Osun governorship race) were present and urged wise use of the grants while linking it to broader political support.</p>',
 'local', '2026-07-30', true, false,
 ARRAY['https://dmarketforces.com/first-lady-empowers-1000-petty-traders-in-ile-ife-with-n50m/','https://www.vanguardngr.com/2026/07/first-lady-empowers-1000-petty-traders-in-ile-ife-with-n50m/']),
('tension-is-unbearable-ooni-of-ife-sounds-alarm-begs-inec',
 '‘Tension Is Unbearable!’ — Ooni of Ife Sounds Alarm, Begs INEC to Save Osun',
 'Traditional rulers reject violence, demand free and fair governorship poll',
 '<p>The Ooni (and other traditional rulers) has repeatedly warned that political tension ahead of the 15 August governorship election has become “unbearable.” He urged INEC to act as a fair umpire, called for peace, and stressed that Osun (and Ile-Ife as the Yoruba source) is bigger than any politician.</p><p>He met the INEC Chairman (Prof. Joash Amupitan) at the palace and received royal blessings appeals. Traditional rulers collectively rejected endorsing chaos or violence.</p>',
 'local', '2026-07-30', false, false,
 ARRAY['https://saharareporters.com/2026/07/29/osun-governorship-election-ooni-ife-warns-against-political-violence-asks-inec-allow','https://thesun.ng/osun-2026-political-tension-unbearable-ooni-tells-inec-chairman/','https://tribuneonlineng.com/we-wont-endorse-chaos-ooni-other-osun-monarchs-reject-violence-ahead-guber-poll/','https://www.thisdaylive.com/2026/07/29/ooni-were-worried-over-rising-political-tension-ahead-of-osun-governorship-poll/','https://thenationonlineng.net/ooni-inec-chair-express-concern-over-rising-political-tension-in-osun/']),
('police-raid-osun-ssg-house-recover-n4-8m-pvcs',
 'BREAKING: Police Raid Osun SSG’s House, Recover ₦4.8m, PVCs… Then Release Him',
 'Vote-buying probe rocks state as Accord cries foul over ‘political witch-hunt’',
 '<p>Police raided a residence linked to the Secretary to the State Government in Osogbo, arrested him and five others, and recovered ₦4.81 million in cash, Permanent Voter Cards (PVCs), a voter register (Wards 1–15), a laptop, printer, and photocopier. The command cited possible electoral offences including vote-buying.</p><p>He was released later on 30 July while investigations continue. The Osun government and Accord Party figures alleged political targeting/intimidation; the Speaker of the Osun Assembly claimed the arrest was retaliatory after an INEC stakeholders’ meeting. This intensifies statewide tension that affects Ife as part of Osun.</p>',
 'state', '2026-07-30', false, true,
 ARRAY['https://www.informationng.com/2026/07/osun-ssg-nabbed-for-alleged-vote-buying-recover-n4-8m-cash-pvcs-voter-register-from-residence.html','https://dailypost.ng/2026/07/30/police-release-osun-ssg-igbalaye/','https://saharareporters.com/2026/07/29/police-arrest-osun-ssg-others-over-alleged-vote-buying-investigation-recover-n48million','https://thenationonlineng.net/just-in-osun-ssg-five-others-arrested-for-alleged-possession-of-n4-8m-pvcs/','https://www.naijanews.com/2026/07/30/police-release-osun-ssg/','https://thesun.ng/osun-ssg-regains-freedom-as-police-continue-investigation/']),
('inec-extends-pvc-collection-till-friday-votes-not-bullets',
 'INEC Extends PVC Collection Till Friday, Vows ‘Votes, Not Bullets’ Will Decide Osun',
 '4,427 BVAS ready as commission moves to stop disenfranchisement ahead of August 15',
 '<p>INEC extended Permanent Voter Card collection (at Registration Area level) until Friday 31 July after ~62% of newly registered voters had collected.</p><p>The commission has customised/deployed 4,427 BVAS devices (including backups), insists biometric accreditation is the only method, and assures that the election outcome will be decided by votes, not violence. A mock accreditation exercise is planned for 1 August. Stolen PVCs are said to be blacklisted and unusable.</p>',
 'state', '2026-07-30', false, false,
 ARRAY['https://allafrica.com/stories/202607300254.html','https://thesun.ng/osun-inec-deploys-4427-bvas-devices-extends-pvc-collection-to-july-31/','https://tribuneonlineng.com/inec-assures-credible-poll-deploys-4427-bvas-extends-pvc-collection/','https://pmnewsnigeria.com/2026/07/29/inec-extends-pvc-collection-deadline-in-osun-state/','https://www.tvcnews.tv/ballot-box-will-determine-osun-election-not-bullets-inec/','https://dailytrust.com/osun-poll-inec-extends-pvc-collection/']),
('gunshots-rock-mayfair-motor-park-ile-ife',
 'Gunshots Rock Mayfair Motor Park in Ile-Ife as Thugs Clash Over Garage Takeover',
 'Navy intervenes, police restore calm after NURTW factional crisis sparks panic',
 '<p>Gunshots and panic erupted at Mayfair Garage amid an alleged attempt by a NURTW faction (linked to Asiri Eniba) to take over the park, reportedly involving police presence. Commuters, traders, and residents fled.</p><p>Nigerian Navy personnel later intervened; police said normalcy was restored with proportionate force. This relates to ongoing transport-union crises and the state government’s earlier suspension of NURTW activities in parks.</p>',
 'local', '2026-07-30', false, false,
 ARRAY['https://guardian.ng/news/nigeria/metro/osun-police-restore-normalcy-as-gunshots-rock-ife-motor-park/','https://saharareporters.com/2026/07/26/gunshots-police-allegedly-escort-thugs-seize-osun-motor-park-despite-govts-suspension','https://osundefender.com/panic-gunshots-as-police-allegedly-escort-asiri-eniba-to-take-over-garage-in-ile-ife/','https://osundefender.com/video-panic-in-ile-ife-as-asiri-eniba-attempts-to-take-over-mayfair-garage-as-police-escort-team-gunshots-fired/','https://politicsnigeria.com/2026/07/26/gunshots-rocks-osun-motor-park-as-thugs-defy-adelekes-suspension-order/']),
('new-cp-storms-osun-as-gotan-axed-erale-takes-charge',
 'BREAKING: New CP Storms Osun as Gotan Axed — Erale Takes Charge Ahead of Guber Poll',
 'Police leadership shake-up hits Osun hours after tension peaks',
 '<p>The Nigeria Police Force has deployed CP Samuel Erale to Osun State as the new Commissioner of Police to oversee election security ahead of the 15 August governorship poll. He replaces CP Ibrahim Gotan, who was redeployed to Force Headquarters, Abuja, on special duty.</p><p>The move follows weeks of pressure over alleged bias and recent controversies including the SSG raid.</p>',
 'state', '2026-07-31', true, true,
 ARRAY['https://www.naijanews.com/2026/07/31/police-deploy-new-cp-to-osun/','https://tribuneonlineng.com/igp-redeploys-osun-cp-ibrahim-gotan-ahead-of-guber-election/','https://saharareporters.com/2026/07/31/police-deploy-new-commissioner-osun-ahead-august-15-governorship-election/']),
('us-shuts-abuja-visa-desk-lagos-now-only-hub',
 'US Shuts Abuja Visa Desk from Tomorrow — Lagos Now Only Hub for Nigerian Applicants',
 'Routine visa services end at Abuja embassy as America centralises operations',
 '<p>From 1 August 2026, the US Embassy in Abuja will stop processing routine immigrant and non-immigrant visas. All applicants must now use the US Consulate in Lagos as Nigeria’s designated regional hub.</p><p>Existing visas remain valid and the embassy continues other consular services.</p>',
 'global', '2026-07-31', false, false,
 ARRAY['https://guardian.ng/breakingnews/u-s-ends-routine-visa-services-at-embassy-in-abuja/','https://www.thecable.ng/us-relocates-routine-visa-processing-for-abuja-24-african-cities-to-regional-hubs-from-august-1/','https://punchng.com/us-ends-routine-visa-processing-at-abuja-embassy/']),
('tinubu-draws-red-line-no-ransom-no-negotiation',
 'Tinubu Draws Red Line: “No Ransom, No Negotiation with Terrorists and Kidnappers”',
 'President rejects demands for money and release of detained gang members',
 '<p>President Bola Tinubu declared that Nigeria will never pay ransom or negotiate with terrorists, bandits or kidnappers.</p><p>He revealed that Oriire (Oyo) abductors demanded both cash and the release of their jailed members, but the government refused. The victims were later rescued through intelligence-led operations.</p>',
 'national', '2026-07-31', false, false,
 ARRAY['https://www.thisdaylive.com/2026/07/31/tinubu-well-not-pay-ransom-or-negotiate-with-terrorists-murderers-kidnappers/','https://dailypost.ng/2026/07/31/i-refuse-to-pay-ransom-bandits-terrorists-want-members-released-tinubu/','https://punchng.com/we-wont-pay-ransom-to-terrorists-tinubu/']),
('power-subsidy-dies-in-2027-fuel-savings-revealed',
 'Power Subsidy Dies in 2027 — Tinubu Govt Also Reveals How Fuel Savings Are Being Spent',
 'No immediate tariff hike promised as government phases out electricity support',
 '<p>The Federal Government plans to end power-sector subsidy payments from 2027. Power Minister Joseph Tegbe said the move will not deprive citizens of benefits and there are no immediate plans for tariff increases.</p><p>Separately, officials detailed that fuel-subsidy savings have gone into debt servicing, salaries, minimum wage and student loans.</p>',
 'national', '2026-07-31', false, false,
 ARRAY['https://www.naijanews.com/2026/07/31/tinubu-govt-announces-plans-to-end-power-sector-subsidy/','https://www.arise.tv/nigeria-to-end-power-subsidies-from-2027-rules-out-immediate-tariff-hike/','https://www.thecable.ng/breaking-fg-to-end-power-sector-subsidy-next-year/']),
('inec-countdown-begins-pvc-collection-ends-today',
 'INEC Countdown Begins: PVC Collection Ends Today as Osun Tension Rises, 2027 Details Drop Tomorrow',
 'Last chance for ward-level collection as mock accreditation set for Saturday',
 '<p>Permanent Voter Card collection at Registration Areas across Osun ends today, 31 July. Collection moves to Local Government offices from 1–7 August.</p><p>INEC has also scheduled the publication of personal particulars of 2027 presidential and National Assembly candidates for 1 August and continues to insist that votes, not violence, will decide the Osun election.</p>',
 'state', '2026-07-31', false, false,
 ARRAY['https://thesun.ng/osun-inec-deploys-4427-bvas-devices-extends-pvc-collection-to-july-31/','https://punchng.com/inec-extends-pvc-collection-says-violence-wont-decide-osun-poll/','https://pmnewsnigeria.com/2026/07/29/inec-extends-pvc-collection-deadline-in-osun-state/','https://tribuneonlineng.com/inec-assures-credible-poll-deploys-4427-bvas-extends-pvc-collection/','https://tribuneonlineng.com/anxiety-as-inec-set-to-publish-particulars-of-presidential-nass-candidates-tomorrow/']);

INSERT INTO public.statuses (message) VALUES ('FREE FOREVER — Ife Today, The Voice of the Ancient City. WhatsApp, Facebook, Instagram, X & TikTok coming soon.');
INSERT INTO public.adverts (title, link_url) VALUES ('PLACE YOUR ADVERT HERE', null);
