/**
 * Единая точка входа в API.
 * Переключение транспорта: VITE_TRANSPORT=grpc (приложение) | rest (браузер, по умолчанию)
 *
 * Использование:
 *   import { auth, students } from "@/api/client";
 *   const tokens = await auth.login({ login, password, appId: 1 });
 */

import * as authGrpc      from "./transport/grpc/sso/auth.grpc";
import * as studentsGrpc   from "./transport/grpc/journal/students.grpc";
import * as teachersGrpc   from "./transport/grpc/journal/teachers.grpc";
import * as classesGrpc    from "./transport/grpc/journal/classes.grpc";
import * as subjectsGrpc   from "./transport/grpc/journal/subjects.grpc";
import * as gradesGrpc     from "./transport/grpc/journal/grades.grpc";
import * as homeworkGrpc   from "./transport/grpc/journal/homework.grpc";
import * as statusCodesGrpc from "./transport/grpc/journal/statusCodes.grpc";
import * as teachingLoadGrpc from "./transport/grpc/journal/teachingLoad.grpc";

import * as authRest      from "./transport/rest/sso/auth.rest";
import * as studentsRest   from "./transport/rest/journal/students.rest";
import * as teachersRest   from "./transport/rest/journal/teachers.rest";
import * as classesRest    from "./transport/rest/journal/classes.rest";
import * as subjectsRest   from "./transport/rest/journal/subjects.rest";
import * as gradesRest     from "./transport/rest/journal/grades.rest";
import * as homeworkRest   from "./transport/rest/journal/homework.rest";
import * as statusCodesRest from "./transport/rest/journal/statusCodes.rest";
import * as teachingLoadRest from "./transport/rest/journal/teachingLoad.rest";

const isGrpc = import.meta.env.VITE_TRANSPORT === "grpc";

export const auth          = isGrpc ? authGrpc          : authRest;
export const students      = isGrpc ? studentsGrpc      : studentsRest;
export const teachers      = isGrpc ? teachersGrpc      : teachersRest;
export const classes       = isGrpc ? classesGrpc       : classesRest;
export const subjects      = isGrpc ? subjectsGrpc      : subjectsRest;
export const grades        = isGrpc ? gradesGrpc        : gradesRest;
export const homework      = isGrpc ? homeworkGrpc      : homeworkRest;
export const statusCodes   = isGrpc ? statusCodesGrpc   : statusCodesRest;
export const teachingLoad  = isGrpc ? teachingLoadGrpc  : teachingLoadRest;
