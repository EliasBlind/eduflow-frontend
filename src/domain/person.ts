import { z } from "zod";

export const Role = {
  Admin: "admin",
  Student: "student",
  Teacher: "teacher",
  Unauthorized: "",
} as const;

export type TRole = typeof Role[keyof typeof Role];

const PersonSchema = z.object({
  login: z.string()
    .min(3, "Логин должен быть не менее 3 символов")
    .max(24, "Логин слишком длинный"),

  email: z.email({ error: "Некорректный формат email" }),

  password: z.string()
    .min(5, "Пароль должен содержать минимум 5 символов"),

  personClass: z.string().optional(),

  role: z.enum(Role, { error: "Выбрана несуществующая роль" }).optional(),
});

export class Person {
  readonly login?: string;
  readonly email?: string;
  readonly password?: string;
  readonly group?: string;
  readonly role?: TRole;

  constructor(login?: string, email?: string, password?: string, group?: string, role?: TRole) {
    this.login = login;
    this.email = email;
    this.password = password;
    this.group = group;
    this.role = role;
  }

  public validate(): null | string {
    const result = PersonSchema.safeParse(this);

    if (result.success) {
      return null;
    }

    const errorMessages = result.error.issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");

    return errorMessages;
  }
}
