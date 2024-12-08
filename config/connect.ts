import { DataSource, DataSourceOptions } from "typeorm"; 
import { config } from "dotenv";
config();

export const connectDb:DataSourceOptions = {
    type: process.env.TYPE as any,
    host: process.env.HOST,
    port: Number(process.env.PORT),
    username: 'postgres',
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/config/migrations/*{.ts,.js}'],
    logging: true,
    synchronize: true,
}

const connect = new DataSource(connectDb); 
export default connect;