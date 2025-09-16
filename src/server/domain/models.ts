export type Status = "NORMAL" | "VOID";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  status: Status;
}

export interface Resource {
  id: string;
  title: string;
  icon: string | null;
  url: string;
  categoryId: number | null;
  synopsis: string | null;
  status: Status;
}

export interface User {
  id: string;
  userName: string | null;
  password: string;
  avatar: string | null;
  email: string | null;
  role: string | null;
  status: Status;
  createTime: Date;
}

export type Page<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
};


