export const REFERRAL_CODE = "BC123456";
export const REFERRAL_REWARD = 10;

export type DemoReferral = { id: string; name: string; status: "Joined" | "Pending"; date: string };

export const DEMO_REFERRALS: DemoReferral[] = [
  { id: "ref-ada", name: "Ada Okonkwo", status: "Joined", date: "Oct 20, 2026" },
  { id: "ref-chinedu", name: "Chinedu Adeyemi", status: "Pending", date: "Oct 28, 2026" },
];
