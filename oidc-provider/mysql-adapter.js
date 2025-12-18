import mysql from 'mysql2/promise';

// MySQL connection pool
let pool;

export function initializeDatabase(config) {
    pool = mysql.createPool({
        host: config.host || '147.93.156.241',
        user: config.user || 'root',
        port: config.port || 3306,
        password: config.password || 'Long@1234',
        database: config.database || 'test_oidc',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    console.log('📦 MySQL connection pool created');
    return pool;
}

// Map model names to table names (matching NestJS entities)
const TABLE_MAP = {
    'Session': 'oidc_sessions',
    'AccessToken': 'oidc_access_tokens',
    'AuthorizationCode': 'oidc_authorization_codes',
    'RefreshToken': 'oidc_refresh_tokens',
    'Grant': 'oidc_grants',
    'Interaction': 'oidc_interactions',
};

// Create tables if they don't exist (matching NestJS entities structure)
export async function createTables() {
    const connection = await pool.getConnection();

    try {
        // Create all OIDC tables matching NestJS entities
        const tables = [
            'oidc_sessions',
            'oidc_access_tokens',
            'oidc_authorization_codes',
            'oidc_refresh_tokens',
            'oidc_grants',
            'oidc_interactions'
        ];

        for (const tableName of tables) {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id VARCHAR(255) PRIMARY KEY,
                    uid VARCHAR(255) NOT NULL UNIQUE,
                    data JSON NOT NULL,
                    expiresAt DATETIME NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_uid (uid),
                    INDEX idx_expires_at (expiresAt)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
        }

        console.log('✅ Database tables created/verified:', tables.join(', '));
    } finally {
        connection.release();
    }
}

// MySQL Adapter for oidc-provider
// This should be a class constructor, not a factory function
class MySQLAdapter {
    constructor(name) {
        this.name = name;
        this.tableName = TABLE_MAP[name] || `oidc_${name.toLowerCase()}s`;
        console.log(`🏭 Creating MySQL adapter instance for model: ${name} -> table: ${this.tableName}`);
    }

    async upsert(id, payload, expiresIn) {
        console.log(`💾 ${this.name} adapter upsert called with id:`, id);

        try {
            const expiresAt = expiresIn
                ? new Date(Date.now() + expiresIn * 1000)
                : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default

            const uid = payload.uid || id;
            const data = JSON.stringify(payload);

            await pool.execute(
                `INSERT INTO ${this.tableName} (id, uid, data, expiresAt) 
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 uid = VALUES(uid),
                 data = VALUES(data),
                 expiresAt = VALUES(expiresAt)`,
                [id, uid, data, expiresAt]
            );

            console.log(`✅ ${this.name} adapter upsert successful for id:`, id);
        } catch (error) {
            console.error(`💥 Error in ${this.name} adapter upsert:`, error);
            throw error;
        }
    }

    async find(id) {
        console.log(`🔍 ${this.name} adapter find called with id:`, id);

        try {
            const [rows] = await pool.execute(
                `SELECT data, expiresAt FROM ${this.tableName} WHERE id = ?`,
                [id]
            );

            if (rows.length === 0) {
                console.log(`❌ ${this.name} entity not found for id:`, id);
                return undefined;
            }

            const entity = rows[0];

            if (entity.expiresAt && new Date(entity.expiresAt) < new Date()) {
                console.log(`⏰ ${this.name} entity expired, destroying:`, id);
                await this.destroy(id);
                return undefined;
            }

            console.log(`✅ ${this.name} entity found:`, { id, hasData: !!entity.data });
            return typeof entity.data === 'string' ? JSON.parse(entity.data) : entity.data;
        } catch (error) {
            console.error(`💥 Error in ${this.name} adapter find:`, error);
            return undefined;
        }
    }

    async findByUid(uid) {
        console.log(`🔍 ${this.name} adapter findByUid called with uid:`, uid);

        try {
            const [rows] = await pool.execute(
                `SELECT id, data, expiresAt FROM ${this.tableName} WHERE uid = ?`,
                [uid]
            );

            if (rows.length === 0) {
                return undefined;
            }

            const entity = rows[0];

            if (entity.expiresAt && new Date(entity.expiresAt) < new Date()) {
                await this.destroy(entity.id);
                return undefined;
            }

            return typeof entity.data === 'string' ? JSON.parse(entity.data) : entity.data;
        } catch (error) {
            console.error(`💥 Error in ${this.name} adapter findByUid:`, error);
            return undefined;
        }
    }

    async findByUserCode(userCode) {
        console.log(`🔍 ${this.name} adapter findByUserCode called with userCode:`, userCode);

        try {
            const [rows] = await pool.execute(
                `SELECT id, data, expiresAt FROM ${this.tableName}`,
                []
            );

            for (const row of rows) {
                const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                if (data.userCode === userCode) {
                    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
                        await this.destroy(row.id);
                        return undefined;
                    }
                    return data;
                }
            }

            return undefined;
        } catch (error) {
            console.error(`💥 Error in ${this.name} adapter findByUserCode:`, error);
            return undefined;
        }
    }

    async destroy(id) {
        console.log(`🗑️ ${this.name} adapter destroy called with id:`, id);

        try {
            await pool.execute(
                `DELETE FROM ${this.tableName} WHERE id = ?`,
                [id]
            );
            console.log(`✅ ${this.name} adapter destroy successful for id:`, id);
        } catch (error) {
            console.error(`💥 Error in ${this.name} adapter destroy:`, error);
            throw error;
        }
    }

    async revokeByGrantId(grantId) {
        console.log(`🗑️ ${this.name} adapter revokeByGrantId called with grantId:`, grantId);

        try {
            const [rows] = await pool.execute(
                `SELECT id, data FROM ${this.tableName}`,
                []
            );

            let deleteCount = 0;
            for (const row of rows) {
                const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                if (data.grantId === grantId) {
                    await pool.execute(
                        `DELETE FROM ${this.tableName} WHERE id = ?`,
                        [row.id]
                    );
                    deleteCount++;
                }
            }

            console.log(`✅ ${this.name} adapter revokeByGrantId successful, deleted ${deleteCount} entities`);
        } catch (error) {
            console.error(`💥 Error in ${this.name} adapter revokeByGrantId:`, error);
            throw error;
        }
    }

    async consume(id) {
        console.log(`🍽️ ${this.name} adapter consume called with id:`, id);

        try {
            const [rows] = await pool.execute(
                `SELECT data FROM ${this.tableName} WHERE id = ?`,
                [id]
            );

            if (rows.length > 0) {
                const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
                data.consumed = Math.floor(Date.now() / 1000);

                await pool.execute(
                    `UPDATE ${this.tableName} SET data = ? WHERE id = ?`,
                    [JSON.stringify(data), id]
                );

                console.log(`✅ ${this.name} adapter consume successful for id:`, id);
            }
        } catch (error) {
            console.error(`💥 Error in ${this.name} adapter consume:`, error);
            throw error;
        }
    }
}

export default MySQLAdapter;


// curl 'http://localhost:3000/me' \
//   -H 'Accept: */*' \
//   -H 'Accept-Language: en-US,en;q=0.9,vi;q=0.8' \
//   -H 'Authorization: Bearer T8dhiyjVhyzzeEBlCFzADaWj_aEAsmq5ubfv_9VeCuR' \
//   -H 'Connection: keep-alive' \
//   -H 'Origin: http://localhost:4000' \
//   -H 'Referer: http://localhost:4000/' \
//   -H 'Sec-Fetch-Dest: empty' \
//   -H 'Sec-Fetch-Mode: cors' \
//   -H 'Sec-Fetch-Site: same-site' \
//   -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \
//   -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \
//   -H 'sec-ch-ua-mobile: ?0' \
//   -H 'sec-ch-ua-platform: "macOS"'