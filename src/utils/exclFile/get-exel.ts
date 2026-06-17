import { read, utils, type WorkBook, type WorkSheet } from 'xlsx';
import { Person, Role, type TRole } from '@/domain/person';

export class ExelFile {
  readonly pages: number;
  private readonly _workbook: WorkBook;
  private _currentPage: number;

  set currentPageNumber(index: number) {
    this._currentPage = index % this.pages;
    if (this._currentPage < 0) {
      this._currentPage += this.pages;
    }
  }

  get currentPageNumber(): number {
    return this._currentPage;
  }

  get currentPageData(): WorkSheet {
    const sheetName = this._workbook.SheetNames[this._currentPage];
    return this._workbook.Sheets[sheetName];
  }

  private constructor (workbook: WorkBook, pages: number) {
    this._workbook = workbook;
    this.pages = pages;
    this._currentPage = 0;
  }

  static async create(file: File): Promise<ExelFile> {
    try {
      const data = await file.arrayBuffer();

      const workbook = read(data, { type: "array" });

      const sheetNames = workbook.SheetNames;
      const pages = sheetNames.length;

      return new ExelFile(workbook, pages);
    } catch {
      throw new Error("It is not possible to open the battery");
    }
  }

  public parseCurrentPage(): Person[] {
    const sheetName = this._workbook.SheetNames[this._currentPage];
    const sheet = this._workbook.Sheets[sheetName];

    const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet);

    return rawRows.map(row => {
      let login: string | undefined;
      let email: string | undefined;
      let password: string | undefined;
      let group: string | undefined;
      let role: TRole | undefined;

      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.trim().toLowerCase();
        const targetProperty = COLUMN_MAPPING[normalizedKey];

        if (!targetProperty) return new Person();

        const stringValue = String(value).trim();

        if (targetProperty === 'login') login = stringValue;
        if (targetProperty === 'email') email = stringValue;
        if (targetProperty === 'password') password = stringValue;
        if (targetProperty === 'group') group = stringValue;
        if (targetProperty === 'role') {
          const normalizedRole = stringValue.toLowerCase();
          role = ROLE_MAPPING[normalizedRole] || Role.Unauthorized;
        }
      }

      return new Person(login, email, password, group, role);
    });
  }
}

const COLUMN_MAPPING: Record<string, keyof Person> = {
  // Email
  'email': 'email',
  'почта': 'email',
  'электронная почта': 'email',
  'емейл': 'email',

  // Login
  'login': 'login',
  'фио': 'login',
  'фамилия имя отчество': 'login',
  'логин': 'login',
  'имя пользователя': 'login',

  // Password
  'пароль': 'password',
  'password': 'password',
  'paswd': 'password',

  // Class
  'personclass': 'group',
  'класс': 'group',
  'группа': 'group',

  // Role
  'role': 'role',
  'роль': 'role',
  'статус': 'role'
};

// Функция для нормализации ролей (из строк Excel в TRole)
const ROLE_MAPPING: Record<string, TRole> = {
  'admin': Role.Admin,
  'админ': Role.Admin,
  'администратор': Role.Admin,
  'student': Role.Student,
  'студент': Role.Student,
  'ученик': Role.Student,
  'teacher': Role.Teacher,
  'учитель': Role.Teacher,
  'преподаватель': Role.Teacher,
};
