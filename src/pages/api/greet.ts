// pages/api/greet.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body;
  res.status(200).json({ greeting: `Hello, ${name || "stranger"}!` });
}
