import {Router, Response} from 'express';
import { AuthRequest,requireAuth } from '../middleware/auth';
import {prisma} from '../prismaClient'

const router = Router();

router.post('/read',requireAuth,async (req:AuthRequest,res:Response) => {
    await prisma.groupChatRead.upsert({
        where: {userId:req.userId},
        update: {lastReadAt: new Date()},
        create: {userId:req.userId!, lastReadAt: new Date()}
    });

    res.json({ success: true })
});

router.get('/unread',requireAuth,async (req:AuthRequest,res:Response) => {
    const readRecord = await prisma.groupChatRead.findUnique(
        {where: {userId: req.userId}}
    );

    const lastReadAt = readRecord?.lastReadAt || new Date(0); //epoch if never read

    const unreadCount = await prisma.message.count(
        {where: {createdAt:{gt: lastReadAt}}}
    );

    res.json({unreadCount});
});

router.get('/lastRead',requireAuth,async (req:AuthRequest,res:Response) => {
    const allReads = await prisma.groupChatRead.findMany({
        select: {userId:true,lastReadAt:true}
    });

    res.json(allReads);
})

export default router;