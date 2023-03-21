/**
 * Copyright 2022 One Law LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef CRSQLITE_TRIGGERS_H
#define CRSQLITE_TRIGGERS_H

#include <ctype.h>

#include "crsqlite.h"

int crsql_createCrrTriggers(sqlite3 *db, crsql_TableInfo *tableInfo,
                            char **err);

int crsql_createInsertTrigger(sqlite3 *db, crsql_TableInfo *tableInfo,
                              char **err);

int crsql_createUpdateTrigger(sqlite3 *db, crsql_TableInfo *tableInfo,
                              char **err);

int crsql_createDeleteTrigger(sqlite3 *db, crsql_TableInfo *tableInfo,
                              char **err);
char *crsql_deleteTriggerQuery(crsql_TableInfo *tableInfo);

char *crsql_insertTriggerQuery(crsql_TableInfo *tableInfo, char *pkList,
                               char *pkNewList);
int crsql_remove_crr_triggers_if_exist(sqlite3 *db, const char *tblName);

#endif
